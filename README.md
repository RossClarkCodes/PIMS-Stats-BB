# Winnipeg Blue Bombers 2025 Season Stats

Automated daily statistics collection for the Winnipeg Blue Bombers 2025 CFL season.

## 🏈 What This Does

This repository automatically fetches player statistics from the CFL's PIMS API daily and generates:

- **Complete Data**: Full roster + all player stats + team totals
- **Season Stats**: Player season totals only (no individual games)
- **Team Summary**: High-level team statistics

All data is available in both JSON and XML formats.

## 📊 Available Data Files

### Complete Data
- `blue_bombers_2025_complete.json` - Full dataset with roster and stats
- `blue_bombers_2025_complete.xml` - Same data in XML format

### Season Stats Only
- `blue_bombers_2025_season_stats.json` - Season totals for each player
- `blue_bombers_2025_season_stats.xml` - Same data in XML format

### Team Summary
- `blue_bombers_2025_team_summary.json` - Team-level statistics
- `blue_bombers_2025_team_summary.xml` - Same data in XML format

## 🔄 Automation

- **Schedule**: Runs daily at 2 AM UTC
- **Trigger**: GitHub Actions workflow
- **Hosting**: GitHub Pages (free)
- **URL**: `https://rossclarkcodes.github.io/PIMS-Stats/`

## 🛠️ Setup Instructions

1. **Fork this repository** to your GitHub account
2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (will be created automatically)
   - Save

3. **Enable GitHub Actions**:
   - Go to Settings → Actions → General
   - Allow all actions and reusable workflows
   - Save

4. **Update the repository URL** in `package.json`:
   ```json
   "repository": {
     "url": "https://github.com/rossclarkcodes/PIMS-Stats.git"
   }
   ```

5. **Push to main branch** - the workflow will run automatically

## 📅 Manual Trigger

You can manually trigger the workflow:
1. Go to Actions tab
2. Click "Daily Blue Bombers Stats Update"
3. Click "Run workflow"

## 📈 Data Structure

### Player Information
- Name, position, jersey number
- Birthdate, height, weight, college
- Games played, season totals

### Statistics Tracked
- **Defensive**: Tackles, sacks, interceptions, fumbles, passes defended
- **Offensive**: Passing, rushing, receiving stats
- **Special Teams**: Kicking, punting, returns
- **Team**: Aggregated totals across all players

## 🔧 Technical Details

- **Language**: JavaScript (Node.js)
- **Browser Automation**: Puppeteer
- **CI/CD**: GitHub Actions
- **Hosting**: GitHub Pages
- **Data Source**: CFL PIMS API

## 📝 License

MIT License - feel free to use and modify!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

*Data is automatically updated daily. Last update: [Check the live site]* 