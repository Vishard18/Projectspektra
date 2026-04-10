# Dream Team Lab Foundation Guide

This guide is the **foundation pre-provisioning guide** for the Dream Team multi-agent application. Its purpose is to provision the shared Azure resources that every learner needs before starting the hands-on labs in [`Labguidemain/Lab1.md`](/z:/projectspek/Dream-team-v2/Labguidemain/Lab1.md), [`Labguidemain/Lab2.md`](/z:/projectspek/Dream-team-v2/Labguidemain/Lab2.md), [`Labguidemain/Lab3.md`](/z:/projectspek/Dream-team-v2/Labguidemain/Lab3.md), and [`Labguidemain/Lab4.md`](/z:/projectspek/Dream-team-v2/Labguidemain/Lab4.md).

The Dream Team solution itself is unchanged:

- `backend/` contains the FastAPI + AutoGen / Magentic-One application
- `mcp/` contains the MCP server used by the backend
- `frontend/` contains the React / Vite web application

This guide provisions only the **shared foundation infrastructure**. Learners then create the app-specific Azure resources manually in the labs so they can understand how the application is wired together.

---

## Architecture Intent

The final learner flow is split like this:

- **Pre-provisioned here:** shared Azure platform resources used by the app
- **Created by learners later:** Azure OpenAI, model deployments, Container Apps environment, managed identity, backend Container App, MCP Container App, Static Web App, role assignments, configuration, Docker deployment, and end-to-end testing

This keeps the portal experience focused on the resources that matter most for learning the application flow.

---

## Foundation Resources Provisioned by This Guide

The ARM template deployment in this guide is intended to provision only the following shared resources:

- Resource Group
- Log Analytics Workspace
- Application Insights
- Azure Container Registry
- Key Vault
- Cosmos DB account
- Cosmos DB SQL database
- Cosmos DB containers
- Azure AI Search
- Storage Account
- Session Pool, if required by the current app runtime
- VNet / NSGs only if your delivery environment still requires them

This guide does **not** pre-provision:

- Azure OpenAI
- Azure OpenAI model deployments
- Container Apps Environment
- User-assigned Managed Identity
- Backend Container App
- MCP Container App
- Static Web App
- Learner-specific RBAC assignments

---

## Prerequisites

- Azure subscription with **Owner** or **Contributor + User Access Administrator**
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- Git
- Access to the Dream Team repository

Optional, for later learner labs:

- Docker Desktop
- Node.js 20+
- Python 3.10-3.12
- `uv`

---

## Phase 1: Deploy the Shared Foundation

### Step 1.1: Sign in to Azure

```powershell
az login
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
```

### Step 1.2: Create the Resource Group

```powershell
$RG = "rg-dreamteam-lab"
$LOCATION = "eastus"

az group create --name $RG --location $LOCATION
```

### Step 1.3: Deploy the ARM Template

```powershell
cd lab

az deployment group create `
  --resource-group $RG `
  --template-file arm-template.json `
  --parameters arm-template.parameters.json `
  --parameters location=$LOCATION
```

This deployment is used to create the **shared foundation resources only** for the learner environment.

### Step 1.4: Save the Deployment Outputs

```powershell
$OUTPUTS = az deployment group show `
  --resource-group $RG `
  --name arm-template `
  --query properties.outputs -o json | ConvertFrom-Json

$ACR_LOGIN_SERVER = $OUTPUTS.ACR_LOGIN_SERVER.value
$ACR_NAME = $OUTPUTS.ACR_NAME.value
$KEYVAULT_NAME = $OUTPUTS.KEY_VAULT_NAME.value
$KEYVAULT_URI = $OUTPUTS.KEY_VAULT_URI.value
$COSMOS_URI = $OUTPUTS.COSMOS_DB_URI.value
$STORAGE_ENDPOINT = $OUTPUTS.STORAGE_ACCOUNT_ENDPOINT.value
$STORAGE_ACCOUNT_ID = $OUTPUTS.STORAGE_ACCOUNT_ID.value
$SEARCH_ENDPOINT = $OUTPUTS.AI_SEARCH_ENDPOINT.value
$POOL_ENDPOINT = $OUTPUTS.POOL_MANAGEMENT_ENDPOINT.value
$APPINSIGHTS_CS = $OUTPUTS.APP_INSIGHTS_CONNECTION_STRING.value

Write-Host "ACR: $ACR_LOGIN_SERVER"
Write-Host "Key Vault: $KEYVAULT_URI"
Write-Host "Cosmos: $COSMOS_URI"
Write-Host "Search: $SEARCH_ENDPOINT"
Write-Host "Storage: $STORAGE_ENDPOINT"
Write-Host "Session Pool: $POOL_ENDPOINT"
Write-Host "App Insights: $APPINSIGHTS_CS"
```

Use these values to confirm the shared environment was created successfully.

Outputs tied to learner-created resources are intentionally **not part of this guide**. That includes:

- Container Apps Environment name
- Managed Identity ID or Client ID
- Azure OpenAI endpoint
- Static Web App name

Those values are collected by learners later in Labs 1-4 after they create the corresponding resources.

---

## Phase 2: Validate the Shared Foundation

After deployment, verify the following resources exist in the Azure Portal:

- Resource Group
- Log Analytics Workspace
- Application Insights
- Azure Container Registry
- Key Vault
- Cosmos DB account
- Cosmos DB database and containers
- Azure AI Search
- Storage Account
- Session Pool, if your app flow requires it

Recommended validation steps:

1. Open the resource group in Azure Portal.
2. Confirm the shared resources listed above are present.
3. Open Azure Container Registry and copy the login server.
4. Open Cosmos DB and confirm the expected database and containers exist.
5. Open Azure AI Search and confirm the service endpoint.
6. Open Application Insights and confirm the connection string is available.
7. Open Key Vault and confirm the vault exists.

At this stage, do **not** create:

- Azure OpenAI
- Container Apps Environment
- Managed Identity
- Container Apps
- Static Web App

Those steps belong to the learner labs.

---

## Phase 3: Hand Off to the Learner Labs

Once the shared foundation is ready, continue with the learner-facing labs in this order:

1. [`Labguidemain/Lab1.md`](/z:/projectspek/Dream-team-v2/Labguidemain/Lab1.md)
   Create Azure OpenAI, model deployments, Container Apps Environment, Managed Identity, backend Container App, MCP Container App, Static Web App, and collect the required values.

2. [`Labguidemain/Lab2.md`](/z:/projectspek/Dream-team-v2/Labguidemain/Lab2.md)
   Configure backend and frontend `.env` files in VS Code.

3. [`Labguidemain/Lab3.md`](/z:/projectspek/Dream-team-v2/Labguidemain/Lab3.md)
   Build and push Docker images, then update the Container Apps to use them.

4. [`Labguidemain/Lab4.md`](/z:/projectspek/Dream-team-v2/Labguidemain/Lab4.md)
   Build and deploy the frontend, then test the full multi-agent system end to end.

---

## Notes for Lab Authors

- Keep the ARM deployment focused on **shared foundation resources**
- Keep learner-created resources in the learner labs
- Keep the screenshot-based labs action-oriented and portal-friendly
- Preserve the current application architecture; this guide changes only the learning flow split

---

## Final Resource Split

### Pre-provisioned Resources

- Resource Group
- Log Analytics Workspace
- Application Insights
- Azure Container Registry
- Key Vault
- Cosmos DB account
- Cosmos DB SQL database
- Cosmos DB containers
- Azure AI Search
- Storage Account
- Session Pool, if required by the current app
- VNet / NSGs only if still required by your environment

### Learner-created Resources

- Azure OpenAI resource
- Azure OpenAI model deployment: `gpt-4o`
- Azure OpenAI model deployment: `gpt-4o-mini`
- Azure OpenAI model deployment: `text-embedding-3-large`
- Container Apps Environment
- User-assigned Managed Identity
- Backend Container App
- MCP Container App
- Static Web App
- Required role assignments
- Backend and frontend application configuration
- Docker image build / push / update actions
- Frontend deployment and end-to-end testing
