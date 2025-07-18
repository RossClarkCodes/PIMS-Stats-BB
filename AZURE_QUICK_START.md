# Azure Quick Start Guide

## 🚀 Deploy to Azure in 10 Minutes (Portal Method)

### Prerequisites
- Azure account (free tier works)
- Your Blue Bombers stats code

---

## Step 1: Prepare Your Code

1. **Create a new directory:**
   ```bash
   mkdir azure-blue-bombers
   cd azure-blue-bombers
   ```

2. **Copy your files:**
   ```bash
   cp -r /path/to/PIMS-Stats/* .
   ```

3. **Create `.gitignore`:**
   ```bash
   echo "node_modules/" > .gitignore
   echo "output/" >> .gitignore
   ```

4. **Initialize Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

---

## Step 2: Create Azure App Service

1. **Go to Azure Portal:** https://portal.azure.com

2. **Click "Create a resource"**

3. **Search for "App Service" and click it**

4. **Fill in the form:**
   - **Resource Group:** Create new → "blue-bombers-stats"
   - **Name:** "blue-bombers-stats" (or your choice)
   - **Publish:** Code
   - **Runtime stack:** Node 18 LTS
   - **Operating System:** Linux
   - **Region:** Choose closest to you
   - **App Service Plan:** Basic B1 (or Free F1 for testing)

5. **Click "Review + create" then "Create"**

---

## Step 3: Deploy Your Code

1. **Go to your new App Service**

2. **Click "Deployment Center"**

3. **Choose "Local Git/FTPS credentials"**

4. **Set up deployment credentials:**
   - Username: Choose a username
   - Password: Create a strong password
   - Click "Save"

5. **Copy the Git URL** (looks like: `https://username@blue-bombers-stats.scm.azurewebsites.net/blue-bombers-stats.git`)

6. **In your terminal, add Azure as remote:**
   ```bash
   git remote add azure https://pims-blue-bombers-stats.scm.azurewebsites.net:443/PIMS-blue-bombers-stats.git
   ```

7. **Deploy:**
   ```bash
   git push azure main
   ```

---

## Step 4: Test Your App

1. **Visit your app:** `https://your-app-name.azurewebsites.net`

2. **Test stats endpoint:** `https://your-app-name.azurewebsites.net/stats/`

---

## Step 5: Set Up Daily Automation

1. **Go to your App Service in Azure Portal**

2. **Click "WebJobs" in the left menu**

3. **Click "Add"**

4. **Fill in:**
   - **Name:** "stats-fetcher"
   - **Type:** Triggered
   - **File:** Upload your `azure-deploy.js` file
   - **Trigger:** CRON expression: `0 6 * * *` (daily at 6 AM)

5. **Click "Add"**

---

## Step 6: Verify Everything Works

1. **Test the WebJob:**
   - Go to "WebJobs"
   - Click on your WebJob
   - Click "Run once"
   - Check the logs

2. **Check your stats files:**
   - Visit `/stats/` endpoint
   - You should see generated XML/JSON files

---

## 🎉 You're Done!

Your Blue Bombers stats automation is now running on Azure!

### What You Get:
- ✅ Web interface at `https://your-app-name.azurewebsites.net`
- ✅ Stats files at `https://your-app-name.azurewebsites.net/stats/`
- ✅ Daily automation at 6 AM
- ✅ XML and JSON output files

### Cost:
- **Free Tier (F1):** $0/month (with limitations)
- **Basic Tier (B1):** ~$13/month

### Next Steps:
1. Set up custom domain (optional)
2. Configure SSL certificate
3. Set up monitoring alerts
4. See `AZURE_DEPLOYMENT.md` for advanced options

---

## 🛠️ Troubleshooting

**App not loading?**
- Check deployment logs in Azure Portal
- Verify Node.js version is set to 18
- Check application logs

**WebJob not running?**
- Verify CRON expression: `0 6 * * *`
- Check WebJob logs
- Ensure file permissions are correct

**Need help?**
- Check Azure Portal logs
- See `AZURE_DEPLOYMENT.md` for detailed troubleshooting 