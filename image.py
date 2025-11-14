#!/usr/bin/env python3
"""
Download CFL circle headshots for a team from:
- Roster JSON (your URL)
- PIMS player API (to get circle_headshot_url)

Usage:
  python download_cfl_headshots.py \
    --roster https://rossclarkcodes.github.io/PIMS-Stats-BB/wpg_players_2025_stats.json \
    --out ./headshots/WPG \
    --max-concurrency 10
"""

import argparse
import asyncio
import json
import os
import re
from pathlib import Path

import aiohttp
from aiohttp import ClientTimeout
from tqdm import tqdm

PIMS_PLAYER_API = "https://echo.pims.cfl.ca/api/players/{player_id}"

def safe_name(s: str) -> str:
    # Convert "NICHOLS" → "Nichols", keep hyphens, strip weirds
    s = s.strip().title()
    return re.sub(r"[^A-Za-z0-9\-_]+", "_", s)

async def fetch_json(session: aiohttp.ClientSession, url: str):
    # Handle local files
    if url.startswith('./') or url.startswith('/') or not url.startswith('http'):
        with open(url, 'r') as f:
            return json.load(f)
    else:
        async with session.get(url) as resp:
            resp.raise_for_status()
            return await resp.json()

async def head_ok(session: aiohttp.ClientSession, url: str) -> bool:
    # Some CDNs dislike HEAD: try GET with range to keep it light
    try:
        async with session.get(url, headers={"Range": "bytes=0-0"}) as resp:
            return 200 <= resp.status < 300
    except:
        return False

async def download_file(session: aiohttp.ClientSession, url: str, dest: Path) -> bool:
    try:
        async with session.get(url) as resp:
            if resp.status != 200:
                return False
            data = await resp.read()
            dest.parent.mkdir(parents=True, exist_ok=True)
            with open(dest, "wb") as f:
                f.write(data)
            return True
    except Exception:
        return False

async def get_player_meta(session: aiohttp.ClientSession, player_id: int):
    url = PIMS_PLAYER_API.format(player_id=player_id)
    async with session.get(url) as resp:
        if resp.status != 200:
            raise RuntimeError(f"PIMS API {resp.status} for {player_id}")
        return await resp.json()

async def process_player(semaphore, session, player_id: int, out_dir: Path, pbar):
    async with semaphore:
        try:
            meta = await get_player_meta(session, player_id)
            first = meta.get("firstname") or ""
            last = meta.get("lastname") or ""
            jersey = meta.get("jersey_no") or 0
            circle_url = meta.get("circle_headshot_url")
            fallback_url = meta.get("headshot_url")

            # Construct nice filename
            jersey_str = f"{int(jersey):02d}" if isinstance(jersey, int) else "00"
            filename = f"{jersey_str}_{safe_name(last)}_{player_id}-circ.png"
            dest = out_dir / filename

            # If already downloaded, skip
            if dest.exists() and dest.stat().st_size > 0:
                pbar.update(1)
                return True, player_id, "exists"

            # First: try versioned circle paths (newest first) - these are usually more up-to-date
            versioned_urls = []
            # Check versions -3, -2, -1, then base (no suffix)
            for version in ['-3', '-2', '-1', '']:
                versioned_urls.append(f"https://static.cfl.ca/wp-content/uploads/{player_id}-circ{version}.png")
            
            for versioned_url in versioned_urls:
                if await head_ok(session, versioned_url):
                    ok = await download_file(session, versioned_url, dest)
                    if ok:
                        pbar.update(1)
                        version_suffix = versioned_url.split('-circ')[-1].replace('.png', '') or 'base'
                        return True, player_id, f"versioned-circle-{version_suffix}"

            # Fallback: circle_headshot_url from API
            if circle_url:
                ok = await download_file(session, circle_url, dest)
                if ok:
                    pbar.update(1)
                    return True, player_id, "circle"

            # Fallback 2: plain headshot_url (may be JPG/PNG)
            if fallback_url:
                # preserve extension from fallback_url if present
                ext = ".png"
                m = re.search(r"\.(png|jpg|jpeg|webp)(\?.*)?$", fallback_url, re.I)
                if m:
                    ext = "." + m.group(1).lower()
                dest2 = dest.with_suffix(ext)
                ok = await download_file(session, fallback_url, dest2)
                if ok:
                    pbar.update(1)
                    return True, player_id, "fallback-headshot"

            # Fallback 3: versioned non-circle paths (newest first)
            versioned_plain_urls = []
            # Check versions -3, -2, -1, then base (no suffix)
            for version in ['-3', '-2', '-1', '']:
                versioned_plain_urls.append(f"https://static.cfl.ca/wp-content/uploads/{player_id}{version}.png")
            
            for versioned_plain_url in versioned_plain_urls:
                if await head_ok(session, versioned_plain_url):
                    ok = await download_file(session, versioned_plain_url, dest)
                    if ok:
                        pbar.update(1)
                        version_suffix = versioned_plain_url.split(str(player_id))[-1].replace('.png', '') or 'base'
                        return True, player_id, f"versioned-plain-{version_suffix}"

            pbar.update(1)
            return False, player_id, "missing"
        except Exception as e:
            pbar.update(1)
            return False, player_id, f"error: {e}"

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--roster", required=True, help="URL to roster JSON")
    parser.add_argument("--out", default="./headshots/WPG", help="Output folder")
    parser.add_argument("--max-concurrency", type=int, default=10)
    parser.add_argument("--timeout", type=int, default=20)
    args = parser.parse_args()

    out_dir = Path(args.out)
    timeout = ClientTimeout(total=args.timeout)

    connector = aiohttp.TCPConnector(limit=0, ssl=False)  # ssl=False can help on some systems; remove if not needed
    headers = {
        "User-Agent": "HeadshotFetcher/1.0 (+https://github.com/rossclarkcodes)"
    }

    async with aiohttp.ClientSession(timeout=timeout, connector=connector, headers=headers) as session:
        roster = await fetch_json(session, args.roster)

        # The roster JSON is a dict with numeric-string keys: "1","2",...
        # Extract unique player_ids
        player_ids = []
        for _, rec in roster.items():
            pid = rec.get("player_id")
            if pid and pid not in player_ids:
                player_ids.append(pid)

        semaphore = asyncio.Semaphore(args.max_concurrency)

        results = []
        with tqdm(total=len(player_ids), desc="Downloading headshots") as pbar:
            tasks = [
                asyncio.create_task(process_player(semaphore, session, int(pid), out_dir, pbar))
                for pid in player_ids
            ]
            for coro in asyncio.as_completed(tasks):
                results.append(await coro)

    # Summary
    ok = sum(1 for r in results if r[0])
    missing = [r for r in results if not r[0]]
    print(f"\nDone. Saved {ok}/{len(results)} headshots to {out_dir.resolve()}")
    if missing:
        print("Missing/failed player_ids:")
        for _, pid, reason in missing:
            print(f" - {pid}: {reason}")

if __name__ == "__main__":
    asyncio.run(main())
