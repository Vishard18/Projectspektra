# Dream Team Lab — Step-by-Step Manual Deployment Guide

This lab walks you through deploying the Dream Team multi-agent application to Azure manually. You will use an ARM template to provision infrastructure, configure resources in the Azure Portal, then build and deploy the application images yourself.

---

## Architecture Overview

| Component | Azure Service | Port |
|-----------|--------------|------|
| Backend (FastAPI + AutoGen) | Container App | 3100 |
| MCP Server (FastAPI + MCP) | Container App | 3100 |
| Frontend (React/Vite) | Static Web App | — |
| AI Models | Azure OpenAI (gpt-4o, gpt-4o-mini, text-embedding-3-large) | — |
| Database | Cosmos DB (NoSQL) | — |
| Code Execution Sandbox | Container Apps Dynamic Sessions | — |
| Vector Search | Azure AI Search | — |
| File Storage | Azure Storage Account | — |

---

## Prerequisites

- Azure subscription with **Owner** or **Contributor + User Access Administrator** role
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed (v2.50+)
- [Docker Desktop](https://docs.docker.com/get-started/get-docker/) installed and running
- [Node.js 20+](https://nodejs.org/) installed
- [Python 3.10–3.12](https://www.python.org/) installed
- Git installed

---

## PHASE 1: Deploy Infrastructure with ARM Template

### Step 1.1 — Login to Azure

```powershell
az login
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
```

### Step 1.2 — Create a Resource Group

```powershell
$RG = "rg-dreamteam-lab"
$LOCATION = "eastus"

az group create --name $RG --location $LOCATION
```

### Step 1.3 — Deploy the ARM Template

```powershell
cd lab

az deployment group create `
  --resource-group $RG `
  --template-file arm-template.json `
  --parameters arm-template.parameters.json `
  --parameters location=$LOCATION
```

> **This deploys:** Log Analytics, App Insights, ACR, VNet + NSGs, Container Apps Environment, Managed Identity, Azure OpenAI (with 3 model deployments), Cosmos DB (with database + containers), Storage Account, AI Search, Session Pool, Static Web App, and all necessary RBAC role assignments.

### Step 1.4 — Save the Deployment Outputs

```powershell
# Save all outputs to variables for later use
$OUTPUTS = az deployment group show --resource-group $RG --name arm-template --query properties.outputs -o json | ConvertFrom-Json

$ACR_LOGIN_SERVER = $OUTPUTS.ACR_LOGIN_SERVER.value
$ACR_NAME = $OUTPUTS.ACR_NAME.value
$ACA_ENV = $OUTPUTS.ACA_ENVIRONMENT_NAME.value
$IDENTITY_ID = $OUTPUTS.IDENTITY_RESOURCE_ID.value
$IDENTITY_CLIENT_ID = $OUTPUTS.IDENTITY_CLIENT_ID.value
$OPENAI_ENDPOINT = $OUTPUTS.AZURE_OPENAI_ENDPOINT.value
$COSMOS_URI = $OUTPUTS.COSMOS_DB_URI.value
$STORAGE_ENDPOINT = $OUTPUTS.STORAGE_ACCOUNT_ENDPOINT.value
$STORAGE_ACCOUNT_ID = $OUTPUTS.STORAGE_ACCOUNT_ID.value
$SEARCH_ENDPOINT = $OUTPUTS.AI_SEARCH_ENDPOINT.value
$POOL_ENDPOINT = $OUTPUTS.POOL_MANAGEMENT_ENDPOINT.value
$APPINSIGHTS_CS = $OUTPUTS.APP_INSIGHTS_CONNECTION_STRING.value
$SWA_NAME = $OUTPUTS.STATIC_SITE_NAME.value

# Print them to verify
Write-Host "ACR: $ACR_LOGIN_SERVER"
Write-Host "OpenAI: $OPENAI_ENDPOINT"
Write-Host "Cosmos: $COSMOS_URI"
Write-Host "Search: $SEARCH_ENDPOINT"
Write-Host "Pool: $POOL_ENDPOINT"
```

---

## PHASE 2: Manual Configuration in Azure Portal

### Step 2.1 — Verify OpenAI Model Deployments

1. Go to **Azure Portal** → your resource group → **Azure OpenAI** resource
2. Click **Model deployments** → **Manage Deployments**
3. Verify these 3 deployments exist:
   - `gpt-4o` (GlobalStandard, 200K TPM)
   - `gpt-4o-mini` (GlobalStandard, 70K TPM)
   - `text-embedding-3-large` (Standard, 60K TPM)

### Step 2.2 — (Optional) Adjust Content Safety Filters

1. In Azure OpenAI Studio, go to **Content filters**
2. If using the WebSurfer agent, you may need to lower content filtering thresholds to accommodate web browsing

### Step 2.3 — Verify Cosmos DB Setup

1. Go to **Cosmos DB account** → **Data Explorer**
2. Confirm database `ag_demo` exists with containers:
   - `ag_demo` (partition key: `/user_id`)
   - `agent_teams` (partition key: `/team_id`)

### Step 2.4 — Grant Your User Identity Cosmos DB Data Access

The ARM template grants the **managed identity** access, but you also need access for local development and data ingestion:

1. Go to **Cosmos DB account** → **Settings** → **Keys**
2. Note: The app uses Managed Identity (no keys needed in env vars)
3. For your user, go to **IAM** → **Add role assignment**:
   - **Role:** Cosmos DB Built-in Data Contributor
   - **Assign to:** Your user account

> Alternatively via CLI:
```powershell
$COSMOS_NAME = $OUTPUTS.COSMOS_DB_URI.value -replace 'https://','  ' -replace '.documents.azure.com:443/',''
$MY_PRINCIPAL_ID = az ad signed-in-user show --query id -o tsv

# Create a custom SQL role definition and assignment
az cosmosdb sql role definition create `
  --account-name $COSMOS_NAME.Trim() `
  --resource-group $RG `
  --body '{
    \"RoleName\": \"CosmosDBDataOwner\",
    \"Type\": \"CustomRole\",
    \"AssignableScopes\": [\"/\"],
    \"Permissions\": [{\"DataActions\": [\"Microsoft.DocumentDB/databaseAccounts/readMetadata\", \"Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/*\", \"Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/*\"]}]
  }'
```

### Step 2.5 — (Optional) Grant Your User Session Pool Access

```powershell
az role assignment create `
  --assignee $MY_PRINCIPAL_ID `
  --role "Azure ContainerApps Session Executor" `
  --scope $(az resource show --resource-group $RG --name sessionPool --resource-type "Microsoft.App/sessionPools" --query id -o tsv)
```

---

## PHASE 3: Build and Push Docker Images

### Step 3.1 — Login to Azure Container Registry

```powershell
az acr login --name $ACR_NAME
```

### Step 3.2 — Build and Push the Backend Image

```powershell
cd ..\backend

docker build -t "${ACR_LOGIN_SERVER}/dreamteam/backend:v1" .
docker push "${ACR_LOGIN_SERVER}/dreamteam/backend:v1"
```

> **Note:** The backend Dockerfile installs Playwright + Chromium for the WebSurfer agent. The build may take a few minutes.

### Step 3.3 — Build and Push the MCP Server Image

```powershell
cd ..\mcp

docker build -t "${ACR_LOGIN_SERVER}/dreamteam/mcpserver:v1" .
docker push "${ACR_LOGIN_SERVER}/dreamteam/mcpserver:v1"
```

---

## PHASE 4: Deploy Backend & MCP Server to Container Apps

### Step 4.1 — Generate an MCP API Key

```powershell
$MCP_KEY = [guid]::NewGuid().ToString()
Write-Host "MCP Key: $MCP_KEY (save this!)"
```

### Step 4.2 — Create the MCP Server Container App

```powershell
az containerapp create `
  --name mcpserver `
  --resource-group $RG `
  --environment $ACA_ENV `
  --image "${ACR_LOGIN_SERVER}/dreamteam/mcpserver:v1" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-identity $IDENTITY_ID `
  --user-assigned $IDENTITY_ID `
  --target-port 3100 `
  --ingress external `
  --cpu 2.0 --memory 4.0Gi `
  --min-replicas 1 --max-replicas 10 `
  --env-vars `
    "UAMI_RESOURCE_ID=$IDENTITY_ID" `
    "AZURE_CLIENT_ID=$IDENTITY_CLIENT_ID" `
    "MCP_SERVER_API_KEY=$MCP_KEY"
```

### Step 4.3 — Get the MCP Server URL

```powershell
$MCP_FQDN = az containerapp show --name mcpserver --resource-group $RG --query properties.configuration.ingress.fqdn -o tsv
$MCP_URI = "https://$MCP_FQDN"
Write-Host "MCP Server URL: $MCP_URI"
```

### Step 4.4 — Create the Backend Container App

```powershell
az containerapp create `
  --name backend `
  --resource-group $RG `
  --environment $ACA_ENV `
  --image "${ACR_LOGIN_SERVER}/dreamteam/backend:v1" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-identity $IDENTITY_ID `
  --user-assigned $IDENTITY_ID `
  --target-port 3100 `
  --ingress external `
  --cpu 2.0 --memory 4.0Gi `
  --min-replicas 1 --max-replicas 10 `
  --env-vars `
    "APPLICATIONINSIGHTS_CONNECTION_STRING=$APPINSIGHTS_CS" `
    "AZURE_OPENAI_ENDPOINT=$OPENAI_ENDPOINT" `
    "POOL_MANAGEMENT_ENDPOINT=$POOL_ENDPOINT" `
    "AZURE_CLIENT_ID=$IDENTITY_CLIENT_ID" `
    "PORT=80" `
    "COSMOS_DB_URI=$COSMOS_URI" `
    "COSMOS_DB_DATABASE=ag_demo" `
    "CONTAINER_NAME=ag_demo" `
    "CONTAINER_TEAMS_NAME=agent_teams" `
    "AZURE_SEARCH_SERVICE_ENDPOINT=$SEARCH_ENDPOINT" `
    "AZURE_OPENAI_EMBEDDING_MODEL=text-embedding-3-large" `
    "AZURE_STORAGE_ACCOUNT_ENDPOINT=$STORAGE_ENDPOINT" `
    "AZURE_STORAGE_ACCOUNT_ID=$STORAGE_ACCOUNT_ID" `
    "UAMI_RESOURCE_ID=$IDENTITY_ID" `
    "MCP_SERVER_URI=$MCP_URI" `
    "MCP_SERVER_API_KEY=$MCP_KEY"
```

### Step 4.5 — Get the Backend URL

```powershell
$BACKEND_FQDN = az containerapp show --name backend --resource-group $RG --query properties.configuration.ingress.fqdn -o tsv
$BACKEND_URI = "https://$BACKEND_FQDN"
Write-Host "Backend URL: $BACKEND_URI"
```

### Step 4.6 — Verify Backend is Running

Open the URL in your browser (or curl it):

```powershell
curl "$BACKEND_URI/docs"
```

You should see the FastAPI Swagger docs page.

---

## PHASE 5: Build and Deploy Frontend to Static Web App

### Step 5.1 — Install Frontend Dependencies

```powershell
cd ..\frontend

npm install
```

### Step 5.2 — Create the Environment File

```powershell
@"
VITE_BASE_URL=$BACKEND_URI
VITE_ALLWAYS_LOGGED_IN=true
"@ | Out-File -FilePath .env -Encoding utf8
```

### Step 5.3 — Build the Frontend

```powershell
npm run build
```

This creates a `dist/` folder with the static production build.

### Step 5.4 — Deploy to Static Web App

```powershell
# Get the deployment token
$SWA_TOKEN = az staticwebapp secrets list --name $SWA_NAME --resource-group $RG --query properties.apiKey -o tsv

# Deploy using SWA CLI
npx @azure/static-web-apps-cli deploy ./dist `
  --deployment-token $SWA_TOKEN `
  --env production
```

### Step 5.5 — Get the Frontend URL

```powershell
$FRONTEND_URL = az staticwebapp show --name $SWA_NAME --resource-group $RG --query defaultHostname -o tsv
Write-Host "Frontend URL: https://$FRONTEND_URL"
```

Open `https://$FRONTEND_URL` in your browser — you should see the Dream Team UI.

---

## PHASE 6 (Optional): Ingest Demo Data into AI Search

If you want to use the built-in demo scenarios (FSI Upsell, Predictive Maintenance, Retail, Safety):

### Step 6.1 — Create a Backend .env File

```powershell
cd ..\backend

@"
AZURE_OPENAI_ENDPOINT=$OPENAI_ENDPOINT
AZURE_CLIENT_ID=$IDENTITY_CLIENT_ID
UAMI_RESOURCE_ID=$IDENTITY_ID
AZURE_SEARCH_SERVICE_ENDPOINT=$SEARCH_ENDPOINT
AZURE_STORAGE_ACCOUNT_ENDPOINT=$STORAGE_ENDPOINT
AZURE_STORAGE_ACCOUNT_ID=$STORAGE_ACCOUNT_ID
AZURE_OPENAI_EMBEDDING_MODEL=text-embedding-3-large
COSMOS_DB_URI=$COSMOS_URI
COSMOS_DB_DATABASE=ag_demo
CONTAINER_NAME=ag_demo
CONTAINER_TEAMS_NAME=agent_teams
"@ | Out-File -FilePath .env -Encoding utf8
```

### Step 6.2 — Run the Ingestion Script

```powershell
# Make sure your user has "Search Index Data Contributor" and "Storage Blob Data Contributor" roles
uv venv
.venv\Scripts\activate
uv sync
python -m aisearch
```

This creates four AI Search indexes: `ag-demo-fsi-upsell`, `ag-demo-pred-maint`, `ag-demo-retail`, `ag-demo-safety`.

---

## Verification Checklist

| # | Check | How |
|---|-------|-----|
| 1 | Backend is running | Visit `$BACKEND_URI/docs` — see Swagger UI |
| 2 | MCP Server is running | Visit `$MCP_URI/docs` — see FastAPI docs |
| 3 | Frontend loads | Visit `https://$FRONTEND_URL` — see Dream Team UI |
| 4 | Frontend connects to backend | Open browser DevTools → Network tab, send a message → see API calls to backend |
| 5 | AI Search has indexes | Azure Portal → AI Search → Indexes (if you ran Phase 6) |

---

## Updating the Application

To deploy a new version after code changes:

### Update Backend or MCP Server
```powershell
# Rebuild and push (increment version tag)
cd backend
docker build -t "${ACR_LOGIN_SERVER}/dreamteam/backend:v2" .
docker push "${ACR_LOGIN_SERVER}/dreamteam/backend:v2"

# Update the container app
az containerapp update --name backend --resource-group $RG --image "${ACR_LOGIN_SERVER}/dreamteam/backend:v2"
```

### Update Frontend
```powershell
cd frontend
npm run build
npx @azure/static-web-apps-cli deploy ./dist --deployment-token $SWA_TOKEN --env production
```

---

## Cleanup

To delete all resources when done:

```powershell
az group delete --name $RG --yes --no-wait
```
