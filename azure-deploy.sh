#!/bin/bash

# Azure Deployment Script for Blue Bombers Stats
# This script automates the Azure deployment process

set -e  # Exit on any error

# Configuration
RESOURCE_GROUP="blue-bombers-stats"
LOCATION="eastus"
APP_NAME="blue-bombers-stats"
STORAGE_ACCOUNT="bluebombersstats"
PLAN_NAME="blue-bombers-plan"

echo "🚀 Starting Azure deployment for Blue Bombers Stats..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "🔐 Please log in to Azure..."
    az login
fi

echo "📋 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "📦 Creating App Service plan..."
az appservice plan create \
    --name $PLAN_NAME \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux

echo "🌐 Creating App Service..."
az webapp create \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $PLAN_NAME \
    --runtime "NODE|18-lts"

echo "💾 Creating Storage Account..."
az storage account create \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Standard_LRS

echo "⚙️ Configuring App Service..."
# Set Node.js version
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings WEBSITE_NODE_DEFAULT_VERSION=18.17.0

# Set environment variables
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings NODE_ENV=production

echo "🔧 Setting up deployment source..."
# Get the deployment URL
DEPLOYMENT_URL=$(az webapp deployment source config-local-git \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --query url \
    --output tsv)

echo "📤 Setting up Git deployment..."
# Add Azure as remote if not already added
if ! git remote get-url azure &> /dev/null; then
    git remote add azure $DEPLOYMENT_URL
fi

echo "🚀 Deploying to Azure..."
git push azure main

echo "✅ Deployment completed!"
echo ""
echo "🌐 Your app is available at:"
echo "   https://$APP_NAME.azurewebsites.net"
echo ""
echo "📊 Stats files available at:"
echo "   https://$APP_NAME.azurewebsites.net/stats/"
echo ""
echo "📋 Next steps:"
echo "   1. Set up WebJobs for daily automation"
echo "   2. Configure custom domain (optional)"
echo "   3. Set up monitoring and alerts"
echo "   4. See AZURE_DEPLOYMENT.md for detailed instructions"
echo ""
echo "🔧 To set up WebJobs:"
echo "   1. Go to Azure Portal"
echo "   2. Navigate to your App Service"
echo "   3. Go to 'WebJobs'"
echo "   4. Add a new WebJob with azure-deploy.js"
echo "   5. Set CRON expression: 0 6 * * * (daily at 6 AM)" 