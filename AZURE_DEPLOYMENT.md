# Azure Deployment Guide for Blue Bombers Stats

This guide walks you through deploying your Blue Bombers stats automation to Microsoft Azure.

## Prerequisites

- Azure subscription (free tier works fine)
- Azure CLI installed (optional but helpful)
- Git installed on your computer

## Option 1: Azure App Service (Recommended - Easiest)

### Step 1: Prepare Your Code

1. **Create a new directory for Azure deployment:**
   ```bash
   mkdir azure-blue-bombers
   cd azure-blue-bombers
   ```

2. **Copy your files:**
   ```bash
   cp -r /path/to/PIMS-Stats/* .
   ```

3. **Create a `.gitignore` file:**
   ```bash
   echo "node_modules/" > .gitignore
   echo "output/" >> .gitignore
   echo ".env" >> .gitignore
   ```

4. **Initialize Git repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Azure deployment"
   ```

### Step 2: Create Azure Resources

#### Option A: Using Azure Portal (GUI)

1. **Go to Azure Portal:** https://portal.azure.com

2. **Create App Service:**
   - Click "Create a resource"
   - Search for "App Service"
   - Click "Create"
   - Fill in the details:
     - **Resource Group:** Create new → "blue-bombers-stats"
     - **Name:** "blue-bombers-stats" (or your preferred name)
     - **Publish:** Code
     - **Runtime stack:** Node 18 LTS
     - **Operating System:** Linux
     - **Region:** Choose closest to you
     - **App Service Plan:** Basic B1 (or Free F1 for testing)
   - Click "Review + create" then "Create"

3. **Create Storage Account (for file storage):**
   - Click "Create a resource"
   - Search for "Storage account"
   - Click "Create"
   - Fill in the details:
     - **Resource Group:** "blue-bombers-stats"
     - **Storage account name:** "bluebombersstats" (lowercase, no spaces)
     - **Region:** Same as App Service
     - **Performance:** Standard
     - **Redundancy:** LRS
   - Click "Review + create" then "Create"

#### Option B: Using Azure CLI

1. **Install Azure CLI:** https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

2. **Login to Azure:**
   ```bash
   az login
   ```

3. **Create resource group:**
   ```bash
   az group create --name blue-bombers-stats --location eastus
   ```

4. **Create App Service plan:**
   ```bash
   az appservice plan create --name blue-bombers-plan --resource-group blue-bombers-stats --sku B1 --is-linux
   ```

5. **Create App Service:**
   ```bash
   az webapp create --name blue-bombers-stats --resource-group blue-bombers-stats --plan blue-bombers-plan --runtime "NODE|18-lts"
   ```

6. **Create Storage Account:**
   ```bash
   az storage account create --name bluebombersstats --resource-group blue-bombers-stats --location eastus --sku Standard_LRS
   ```

### Step 3: Configure App Service

1. **Go to your App Service in Azure Portal**

2. **Set up Application Settings:**
   - Go to "Configuration" → "Application settings"
   - Add these settings:
     ```
     WEBSITE_NODE_DEFAULT_VERSION = 18.17.0
     NODE_ENV = production
     PORT = 8080
     ```

3. **Set up WebJobs for automation:**
   - Go to "WebJobs" in the left menu
   - Click "Add"
   - Fill in:
     - **Name:** "stats-fetcher"
     - **Type:** Triggered
     - **File:** Upload your `azure-deploy.js` file
     - **Trigger:** CRON expression: `0 6 * * *` (daily at 6 AM)

### Step 4: Deploy Your Code

#### Option A: Using Azure Portal

1. **Go to your App Service**
2. **Click "Deployment Center"**
3. **Choose "GitHub" or "Local Git"**
4. **Follow the setup wizard**

#### Option B: Using Git (Recommended)

1. **Get deployment URL from Azure Portal:**
   - Go to your App Service
   - Click "Deployment Center"
   - Copy the Git URL

2. **Add Azure as remote:**
   ```bash
   git remote add azure <your-git-url>
   ```

3. **Deploy:**
   ```bash
   git push azure main
   ```

### Step 5: Test Your Deployment

1. **Visit your app:** `https://your-app-name.azurewebsites.net`

2. **Test the stats endpoint:** `https://your-app-name.azurewebsites.net/stats/`

3. **Manually trigger the WebJob:**
   - Go to "WebJobs" in Azure Portal
   - Click on your WebJob
   - Click "Run once"

## Option 2: Azure Functions (Serverless)

### Step 1: Create Function App

1. **In Azure Portal:**
   - Create a resource → "Function App"
   - Runtime stack: Node.js 18
   - Hosting plan: Consumption (serverless)

2. **Create a Timer Trigger function:**
   ```javascript
   // index.js
   const { fetchAllStats } = require('./azure-deploy');
   
   module.exports = async function (context, myTimer) {
       const timeStamp = new Date().toISOString();
       
       if (myTimer.isPastDue) {
           context.log('JavaScript is running late!');
       }
       
       context.log('JavaScript timer trigger function ran!', timeStamp);
       
       try {
           const result = await fetchAllStats();
           context.log('Stats fetch completed:', result);
       } catch (error) {
           context.log.error('Stats fetch failed:', error);
       }
   };
   ```

3. **Configure the timer:**
   - CRON expression: `0 0 6 * * *` (daily at 6 AM)

## Option 3: Azure Container Instances

### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 2: Build and Deploy

1. **Build Docker image:**
   ```bash
   docker build -t blue-bombers-stats .
   ```

2. **Push to Azure Container Registry:**
   ```bash
   az acr create --name bluebombersregistry --resource-group blue-bombers-stats --sku Basic
   az acr login --name bluebombersregistry
   docker tag blue-bombers-stats bluebombersregistry.azurecr.io/blue-bombers-stats
   docker push bluebombersregistry.azurecr.io/blue-bombers-stats
   ```

3. **Deploy to Container Instances:**
   ```bash
   az container create \
     --resource-group blue-bombers-stats \
     --name blue-bombers-container \
     --image bluebombersregistry.azurecr.io/blue-bombers-stats \
     --dns-name-label blue-bombers-stats \
     --ports 3000
   ```

## Monitoring and Maintenance

### 1. Set Up Application Insights

1. **Create Application Insights resource**
2. **Add to your App Service**
3. **Monitor logs and performance**

### 2. Set Up Alerts

1. **Go to "Alerts" in Azure Portal**
2. **Create alert rules for:**
   - WebJob failures
   - High response times
   - Error rates

### 3. Monitor WebJobs

1. **Check WebJob logs:**
   - Go to "WebJobs" in your App Service
   - Click on your WebJob
   - View "Logs"

2. **Set up email notifications for failures**

## Cost Optimization

### Free Tier (F1)
- **App Service:** Free (with limitations)
- **Storage:** 5GB free
- **Bandwidth:** 15GB/month free

### Basic Tier (B1)
- **App Service:** ~$13/month
- **Storage:** Pay per use
- **Bandwidth:** Pay per use

### Serverless (Functions)
- **Pay per execution:** Very cheap for daily runs
- **No idle costs**

## Troubleshooting

### Common Issues:

1. **WebJob not running:**
   - Check CRON expression format
   - Verify file permissions
   - Check logs in Azure Portal

2. **App not starting:**
   - Check Node.js version
   - Verify `package.json` has correct start script
   - Check application logs

3. **Storage issues:**
   - Verify connection strings
   - Check storage account permissions
   - Monitor storage usage

### Useful Commands:

```bash
# View app logs
az webapp log tail --name blue-bombers-stats --resource-group blue-bombers-stats

# Restart app
az webapp restart --name blue-bombers-stats --resource-group blue-bombers-stats

# Check app status
az webapp show --name blue-bombers-stats --resource-group blue-bombers-stats
```

## Security Best Practices

1. **Use Managed Identity** for Azure services
2. **Store secrets in Key Vault**
3. **Enable HTTPS only**
4. **Set up network security groups**
5. **Regular security updates**

## Next Steps

1. **Set up custom domain** (optional)
2. **Configure SSL certificate**
3. **Set up CI/CD pipeline**
4. **Add monitoring and alerting**
5. **Implement backup strategy**

Your Blue Bombers stats automation is now running on Azure! 🎉 