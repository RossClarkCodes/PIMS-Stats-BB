#!/bin/bash

# Blue Bombers Stats Automation - Cron Setup Script
# This script sets up a daily cron job to fetch stats at 6:00 AM

echo "Setting up daily Blue Bombers stats automation..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/automated-fetch.js"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the script exists
if [ ! -f "$NODE_SCRIPT" ]; then
    echo "Error: automated-fetch.js not found in $SCRIPT_DIR"
    exit 1
fi

# Create the cron job entry (runs daily at 6:00 AM)
CRON_JOB="0 6 * * * cd $SCRIPT_DIR && node automated-fetch.js >> output/cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "automated-fetch.js"; then
    echo "Cron job already exists. Removing old entry..."
    crontab -l 2>/dev/null | grep -v "automated-fetch.js" | crontab -
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "Cron job set up successfully!"
echo "The script will run daily at 6:00 AM"
echo "Logs will be saved to output/cron.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove the cron job: crontab -e (then delete the line)"
echo ""
echo "To test the script now, run: npm run fetch" 