# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Test the Automated Script
```bash
npm run fetch
```
This will create XML and JSON files in the `output/` directory.

### 3. Start the Web Server
```bash
npm start
```

### 4. Open in Browser
Visit: `http://localhost:3000`

### 5. View Generated Files
Visit: `http://localhost:3000/stats/`

## 📁 What You Get

After running the automated script, you'll have:

- **`output/blue_bombers_2025_season_stats_latest.xml`** - Latest XML data
- **`output/blue_bombers_2025_season_stats_latest.json`** - Latest JSON data
- **`output/blue_bombers_2025_season_stats_YYYY-MM-DD.xml`** - Daily timestamped files
- **`output/blue_bombers_2025_season_stats_YYYY-MM-DD.json`** - Daily timestamped files

## 🔄 Set Up Daily Automation

### Option 1: Quick Setup (macOS/Linux)
```bash
chmod +x setup-cron.sh
./setup-cron.sh
```

### Option 2: Manual Cron Setup
```bash
crontab -e
# Add this line:
0 6 * * * cd /path/to/PIMS-Stats && node automated-fetch.js >> output/cron.log 2>&1
```

## 🌐 Deploy to Server

See `DEPLOYMENT.md` for detailed server deployment instructions.

## 📊 Sample Output

The generated files contain:
- Team summary statistics
- Individual player stats with 100+ fields
- Player information (name, position, jersey, etc.)
- Season totals calculated from individual games
- Timestamp of data generation

## 🛠️ Troubleshooting

**Script not working?**
- Check Node.js version: `node --version` (should be 18+)
- Check logs: `tail -f output/cron.log`
- Test manually: `npm run fetch`

**Web interface not loading?**
- Ensure server is running: `npm start`
- Check port 3000 is available
- Try: `curl http://localhost:3000`

**API errors?**
- Some players may not have stats (404 errors are normal)
- Check internet connection
- API may have rate limits

## 📞 Support

- Check `README.md` for detailed documentation
- Check `DEPLOYMENT.md` for server setup
- Monitor `output/cron.log` for automation issues 