const fs = require('fs');
const https = require('https');

const TEAMS = [
  { id: 17, name: 'Saskatchewan Roughriders', abbr: 'SSK' },
  { id: 11, name: 'Montreal Alouettes', abbr: 'MTL' }
];

function makeRequest(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    https.get(url, (res) => {
      clearTimeout(timer);
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function fetchTeamRoster(team) {
  const url = `https://echo.pims.cfl.ca/api/teams/${team.id}/roster`;
  console.log(`Fetching roster for ${team.name}...`);
  
  try {
    const data = await makeRequest(url);
    let rosterData = [];
    
    // Handle different response structures
    if (Array.isArray(data)) {
      rosterData = data;
    } else if (data && Array.isArray(data.rosterplayers)) {
      rosterData = data.rosterplayers;
    } else if (data && Array.isArray(data.players)) {
      rosterData = data.players;
    }
    
    return rosterData.map(player => ({
      ...player,
      team_name: team.name,
      team_id: team.id,
      team_abbr: team.abbr
    }));
  } catch (error) {
    console.error(`Error fetching roster for ${team.name}:`, error.message);
    return [];
  }
}

async function fetchPlayerStats(playerId, playerName) {
  const url = `https://echo.pims.cfl.ca/api/stats/players/pims_player/${playerId}`;
  
  try {
    const data = await makeRequest(url);
    
    // Find 2025 season stats
    const seasonStats = (data.seasons || []).find(s => s.season === 2025);
    
    if (seasonStats) {
      // Flatten stats into player object
      return seasonStats;
    }
    return {};
  } catch (error) {
    console.error(`Error fetching stats for player ${playerName} (ID: ${playerId}):`, error.message);
    return {};
  }
}

async function main() {
  console.log('Starting roster fetch for Saskatchewan and Montreal...\n');
  
  for (const team of TEAMS) {
    console.log(`\n=== Processing ${team.name} ===`);
    
    // Fetch roster
    const roster = await fetchTeamRoster(team);
    console.log(`Found ${roster.length} players in roster`);
    
    // Fetch stats for each player
    const playersWithStats = {};
    let statsCount = 0;
    
    for (const player of roster) {
      const playerId = player.player_id || player.id;
      const playerName = `${player.firstname || ''} ${player.lastname || ''}`.trim();
      
      if (!playerId) {
        console.log(`⚠ Skipping player without ID: ${playerName}`);
        continue;
      }
      
      // Fetch stats
      const stats = await fetchPlayerStats(playerId, playerName);
      
      // Merge player data with stats
      const playerWithStats = { ...player };
      if (Object.keys(stats).length > 0) {
        Object.assign(playerWithStats, stats);
        playerWithStats.has_stats = true;
        statsCount++;
      } else {
        playerWithStats.has_stats = false;
      }
      
      // Key by jersey_no, only include if has_stats
      if (playerWithStats.has_stats && playerWithStats.jersey_no != null) {
        playersWithStats[String(playerWithStats.jersey_no)] = playerWithStats;
      }
    }
    
    // Write file
    const filename = `public/${team.abbr.toLowerCase()}_players_2025_stats.json`;
    fs.writeFileSync(filename, JSON.stringify(playersWithStats, null, 2));
    console.log(`✓ Written ${filename} with ${Object.keys(playersWithStats).length} players (${statsCount} with stats)`);
  }
  
  console.log('\n✓ Done!');
}

main().catch(console.error);

