# Deployment Guide

This guide covers different ways to deploy your Blue Bombers stats automation to a server.

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start the web server
npm start

# In another terminal, run the automated fetch
npm run fetch
```

Visit `http://localhost:3000` to see the web interface.

## Server Deployment Options

### Option 1: Simple VPS (Recommended for beginners)

**Requirements:**
- VPS with Ubuntu/Debian (DigitalOcean, Linode, Vultr, etc.)
- SSH access
- Domain name (optional)

**Steps:**

1. **Connect to your server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone your project:**
   ```bash
   git clone <your-repo-url>
   cd PIMS-Stats
   npm install
   ```

4. **Set up the automated script:**
   ```bash
   chmod +x setup-cron.sh
   ./setup-cron.sh
   ```

5. **Install and configure nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

6. **Create nginx configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/blue-bombers-stats
   ```

   Add this content:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # or your server IP
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/blue-bombers-stats /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Set up SSL (optional but recommended):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

9. **Set up PM2 for process management:**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name "blue-bombers-stats"
   pm2 startup
   pm2 save
   ```

### Option 2: AWS EC2

**Steps:**

1. **Launch EC2 instance** (Ubuntu recommended)
2. **Configure security groups** to allow HTTP (80), HTTPS (443), and SSH (22)
3. **Connect via SSH** and follow the VPS steps above
4. **Optional: Use AWS Route 53** for domain management

### Option 3: Google Cloud Platform

**Steps:**

1. **Create Compute Engine instance**
2. **Install Node.js and dependencies**
3. **Set up Cloud Scheduler** for automated runs:
   ```bash
   gcloud scheduler jobs create http blue-bombers-stats \
     --schedule="0 6 * * *" \
     --uri="http://your-instance-ip:3000/api/fetch" \
     --http-method=POST
   ```

### Option 4: Heroku

**Steps:**

1. **Install Heroku CLI**
2. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

3. **Add buildpack for Node.js**
4. **Deploy:**
   ```bash
   git push heroku main
   ```

5. **Set up scheduler addon:**
   ```bash
   heroku addons:create scheduler:standard
   heroku scheduler:add "node automated-fetch.js" --dyno=worker
   ```

### Option 5: Docker Deployment

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**Create docker-compose.yml:**
```yaml
version: '3.8'
services:
  blue-bombers-stats:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./output:/app/output
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

**Deploy:**
```bash
docker-compose up -d
```

## Monitoring and Maintenance

### Check if everything is working:

```bash
# Check if the web server is running
curl http://localhost:3000

# Check if the automated script ran
tail -f output/cron.log

# Check cron job status
crontab -l

# Check nginx status
sudo systemctl status nginx

# Check PM2 status (if using)
pm2 status
```

### Log rotation:

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/blue-bombers-stats
```

Add:
```
/path/to/PIMS-Stats/output/cron.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 www-data www-data
}
```

### Backup strategy:

```bash
# Create backup script
nano backup-stats.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/backup/blue-bombers-stats"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/stats_backup_$DATE.tar.gz output/
find $BACKUP_DIR -name "stats_backup_*.tar.gz" -mtime +30 -delete
```

## Troubleshooting

### Common Issues:

1. **Port 3000 not accessible:**
   - Check firewall settings
   - Verify nginx configuration
   - Check if the Node.js app is running

2. **Automated script not running:**
   - Check cron logs: `tail -f /var/log/cron`
   - Verify cron job exists: `crontab -l`
   - Check file permissions

3. **API errors:**
   - Check network connectivity
   - Verify API endpoints are accessible
   - Check rate limiting

4. **Disk space issues:**
   - Monitor output directory size
   - Set up log rotation
   - Clean old files periodically

### Performance Optimization:

1. **Use PM2 for process management**
2. **Set up nginx caching for static files**
3. **Monitor memory usage**
4. **Set up alerts for failures**

## Security Considerations

1. **Keep Node.js and dependencies updated**
2. **Use HTTPS in production**
3. **Set up firewall rules**
4. **Regular security updates**
5. **Monitor logs for suspicious activity**
6. **Use environment variables for sensitive data**

## Cost Estimation

**Monthly costs (approximate):**

- **VPS (DigitalOcean/Linode):** $5-20/month
- **Domain name:** $10-15/year
- **SSL certificate:** Free (Let's Encrypt)
- **Bandwidth:** Usually included in VPS plans

**Total:** ~$5-25/month depending on server size and traffic. 