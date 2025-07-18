# Blue Bombers 2025 Season Stats Automation

This project automatically fetches and stores Winnipeg Blue Bombers 2025 season statistics from the CFL's PIMS API. It includes both a web interface and an automated script that can run daily.

## Features

- **Web Interface**: Interactive HTML page to fetch and display stats
- **Automated Script**: Node.js script that can run automatically
- **Multiple Formats**: Generates both JSON and XML output
- **Daily Updates**: Can be scheduled to run automatically each day
- **Comprehensive Stats**: Includes all available player and team statistics

## Setup Instructions

### Prerequisites

1. **Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Or install via package manager:
     ```bash
     # macOS (using Homebrew)
     brew install node
     
     # Ubuntu/Debian
     sudo apt update && sudo apt install nodejs npm
     ```

2. **Git** (optional, for version control)

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd PIMS-Stats
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Test the automated script**
   ```bash
   npm run fetch
   ```

## Usage

### Web Interface

1. **Start a local server** (to avoid CORS issues):
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

2. **Open in browser**: `http://localhost:8000/pims-stats.html`

3. **Click "Fetch All Player Stats"** to retrieve the data

### Automated Script

#### Manual Run
```bash
npm run fetch
```

#### Automated Daily Run

**Option 1: Using the setup script (Recommended)**
```bash
chmod +x setup-cron.sh
./setup-cron.sh
```

**Option 2: Manual cron setup**
```bash
# Edit your crontab
crontab -e

# Add this line to run daily at 6:00 AM
0 6 * * * cd /path/to/PIMS-Stats && node automated-fetch.js >> output/cron.log 2>&1
```

**Option 3: Using systemd (Linux)**
```bash
# Create a systemd service file
sudo nano /etc/systemd/system/blue-bombers-stats.service
```

Add this content:
```ini
[Unit]
Description=Blue Bombers Stats Automation
After=network.target

[Service]
Type=oneshot
User=your-username
WorkingDirectory=/path/to/PIMS-Stats
ExecStart=/usr/bin/node automated-fetch.js
StandardOutput=append:/path/to/PIMS-Stats/output/cron.log
StandardError=append:/path/to/PIMS-Stats/output/cron.log

[Install]
WantedBy=multi-user.target
```

Then create a timer:
```bash
sudo nano /etc/systemd/system/blue-bombers-stats.timer
```

Add this content:
```ini
[Unit]
Description=Run Blue Bombers Stats daily
Requires=blue-bombers-stats.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl enable blue-bombers-stats.timer
sudo systemctl start blue-bombers-stats.timer
```

## Output Files

The automated script generates several files in the `output/` directory:

- `blue_bombers_2025_season_stats_YYYY-MM-DD.xml` - Daily XML files with timestamps
- `blue_bombers_2025_season_stats_YYYY-MM-DD.json` - Daily JSON files with timestamps
- `blue_bombers_2025_season_stats_latest.xml` - Latest XML data (always updated)
- `blue_bombers_2025_season_stats_latest.json` - Latest JSON data (always updated)
- `cron.log` - Log file for automated runs

## Server Deployment

### Option 1: Simple File Server

1. **Upload files to your web server**
2. **Set up automated script** on the server
3. **Configure web server** to serve the output directory

Example Apache configuration:
```apache
<Directory "/var/www/html/blue-bombers-stats">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

### Option 2: Cloud Hosting

**AWS S3 + Lambda:**
1. Upload the automated script to AWS Lambda
2. Set up CloudWatch Events to trigger daily
3. Store output files in S3
4. Serve via CloudFront

**Google Cloud Functions:**
1. Deploy the script as a Cloud Function
2. Set up Cloud Scheduler for daily execution
3. Store files in Cloud Storage

**Vercel/Netlify:**
1. Deploy the web interface
2. Use GitHub Actions for automated runs
3. Store data in a database or file storage

### Option 3: Dedicated Server

1. **Set up a VPS** (DigitalOcean, Linode, AWS EC2, etc.)
2. **Install Node.js and dependencies**
3. **Set up the automated script**
4. **Configure web server** (nginx/Apache)
5. **Set up SSL certificate**

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /var/www/blue-bombers-stats;
        index pims-stats.html;
    }
    
    location /stats/ {
        alias /var/www/blue-bombers-stats/output/;
        autoindex on;
    }
}
```

## Monitoring and Logs

### Check if automation is working:
```bash
# View cron logs
tail -f output/cron.log

# Check cron job status
crontab -l

# Test manual run
npm run fetch
```

### Troubleshooting

**Common Issues:**

1. **CORS errors**: Use a local server for the web interface
2. **API rate limiting**: The script includes delays between requests
3. **Permission errors**: Ensure the output directory is writable
4. **Node.js version**: Ensure you're using Node.js 18+

**Log Analysis:**
```bash
# View recent logs
tail -20 output/cron.log

# Search for errors
grep -i error output/cron.log

# Check file sizes
ls -lh output/
```

## Customization

### Configuration Options

Edit the `CONFIG` object in `automated-fetch.js`:

```javascript
const CONFIG = {
    teamId: 20, // Winnipeg Blue Bombers
    season: 2025,
    outputDir: './output',
    rosterUrl: 'https://echo.pims.cfl.ca/api/teams/20/roster',
    delayBetweenRequests: 100 // ms delay between API calls
};
```

### Different Teams

To fetch stats for other teams, change the `teamId`:
- 20: Winnipeg Blue Bombers
- 21: Saskatchewan Roughriders
- 22: Calgary Stampeders
- 23: Edmonton Elks
- 24: BC Lions
- 25: Toronto Argonauts
- 26: Hamilton Tiger-Cats
- 27: Ottawa Redblacks
- 28: Montreal Alouettes

## Support

For issues or questions:
1. Check the logs in `output/cron.log`
2. Test the web interface manually
3. Verify API endpoints are accessible
4. Check Node.js version and dependencies

## License

MIT License - feel free to modify and distribute as needed. 