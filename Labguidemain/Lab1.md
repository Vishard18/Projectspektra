# Exercise 1: Azure Portal — Create the App Resources

#### Estimated Duration: 90 Minutes

## Overview

In this exercise, you will build the **app-specific Azure resources** for the Dream Team multi-agent application. The shared foundation resources have already been pre-provisioned for you by the lab setup guide. Your job is to create the remaining resources in Azure Portal, connect them together, and collect the values that will be used in the later labs.

The Dream Team solution uses:

- a **FastAPI backend** running AutoGen / Magentic-One
- a separate **MCP server**
- a **React frontend**
- **Azure OpenAI** for the model layer
- **Cosmos DB** for chat and team persistence
- **Azure AI Search** and **Storage** for document retrieval

> **Note:** `All resources in this learner lab are created in the existing resource group used for your environment. Use the exact resource names provided by your instructor or lab environment.`

## What Is Already Pre-provisioned

The following shared foundation resources already exist when you start this lab:

| Resource Name | Type | Role in the System |
|---|---|---|
| `crwr46ecluptdzq` | Container Registry | Stores backend and MCP Docker images |
| `cosmos-6wr46ecluptdzq` | Cosmos DB Account | Stores conversation and team data |
| `appi-wr46ecluptdzq` | Application Insights | Telemetry and tracing |
| `log-wr46ecluptdzq` | Log Analytics Workspace | Log storage backend |
| `kv-6wr46ecluptdzq` | Key Vault | Secret storage |
| `srch-wr46ecluptdzq` | AI Search | Document retrieval |
| `stwr46ecluptdzq` | Storage Account | File storage for search ingestion |
| `sessionpool-wr46ecluptdzq` | Session Pool | Code execution session management, if enabled in your environment |

## What You Will Create in This Lab

| Resource | Why You Create It |
|---|---|
| **Azure OpenAI** | The model endpoint used by the app |
| **Model deployments** | `gpt-4o`, `gpt-4o-mini`, and `text-embedding-3-large` |
| **Container Apps Environment** | Hosts the backend and MCP Container Apps |
| **Managed Identity** | Lets the apps access Azure services securely |
| **Container App (Backend)** | Runs the FastAPI multi-agent application |
| **Container App (MCP)** | Runs the MCP server |
| **Static Web App** | Hosts the React frontend |
| **Required role assignments** | Grants the managed identity access to foundation resources |

## Objectives

+ **Task 1:** Review the pre-provisioned resources and collect foundation values
+ **Task 2:** Create Azure OpenAI and all three model deployments
+ **Task 3:** Create the Container Apps Environment and Managed Identity
+ **Task 4:** Create the backend and MCP Container Apps
+ **Task 5:** Create the Static Web App
+ **Task 6:** Assign the required permissions and configure the apps
+ **Task 7:** Collect all values needed for Labs 2-4

---

### Task 1: Review the Pre-provisioned Resources and Collect Foundation Values

1. Open a browser and go to:

   ```
   https://portal.azure.com
   ```

1. Sign in using your lab credentials.

   ![](./media/lab1/image1.png)

1. In the search bar, type **Resource groups (1)** and select **Resource groups (2)**.

   ![](./media/lab1/image2.png)

1. Open the resource group for your environment.

   ![](./media/lab1/image3.png)

1. Review the pre-provisioned resources. Confirm that Container Registry, Cosmos DB, Application Insights, Log Analytics, Key Vault, AI Search, and Storage Account are present.

   ![](./media/lab1/image4.png)

1. Open **Application Insights** and copy the **Connection String**.

   ![](./media/lab1/image5.png)

1. Open **Container Registry** and copy the **Login server** value.

   ![](./media/lab1/image6.png)

1. Open **Cosmos DB** and copy the **URI** from the keys page.

   ![](./media/lab1/image7.png)

1. Open **AI Search** and copy the service endpoint. If your learner flow still uses an admin key for ingestion tasks, copy the **Primary admin key** as well.

   ![](./media/lab1/image8.png)

> **Congratulations** on completing the task! Now, it's time to validate it. Here are the steps:
> - If you receive a success message, you can proceed to the next task.

<validation step="lab1-task1-validate" />

---

### Task 2: Create Azure OpenAI and All Three Model Deployments

Azure OpenAI is the model layer for the Dream Team application. In this task you will create one Azure OpenAI resource and then deploy three models inside it.

| Model | Deployment Name | Purpose |
|---|---|---|
| `gpt-4o` | `gpt-4o` | Primary reasoning model |
| `gpt-4o-mini` | `gpt-4o-mini` | Lower-cost supporting model |
| `text-embedding-3-large` | `text-embedding-3-large` | Embedding model for Azure AI Search |

1. In the Azure Portal search bar, type **Azure OpenAI (1)** and select **Azure OpenAI (2)**.

   ![](./media/lab1/image9.png)

1. Click **+ Create(1)** and choose **Azure OpenAI(2)**.

   ![](./media/lab1/image10.png)

1. On the **Basics** tab, enter the required values for your subscription, resource group, region, name, and pricing tier.

   ![](./media/lab1/image11.png)

1. Click through the remaining tabs, then select **Review + Create** and **Create**.

   ![](./media/lab1/image12.png)

1. After deployment, open the Azure OpenAI resource and copy the **Endpoint**.

   ![](./media/lab1/image13.png)

1. Open **Go to Foundry Portal** and then open **Model deployments**.

   ![](./media/lab1/image15.png)

   ![](./media/lab1/image16.png)

#### Deploy `gpt-4o`

1. Click **+ Deploy model** and choose **Deploy base model**.

   ![](./media/lab1/image17.png)

1. Search for `gpt-4o`, select it, and confirm.

   ![](./media/lab1/image18.png)

1. Set the deployment name to `gpt-4o`, choose the appropriate deployment type, then deploy it.

   ![](./media/lab1/image19.png)

1. Wait until the status shows **Succeeded**.

   ![](./media/lab1/image20.png)

#### Deploy `gpt-4o-mini`

1. Repeat the same flow for `gpt-4o-mini`.

   ![](./media/lab1/image21.png)

#### Deploy `text-embedding-3-large`

1. Repeat the same flow for `text-embedding-3-large`.

   ![](./media/lab1/image22.png)

1. Confirm that all three model deployments appear in the deployments list.

   ![](./media/lab1/image23.png)

> **Congratulations** on completing the task! Now, it's time to validate it. Here are the steps:
> - If you receive a success message, you can proceed to the next task.

<validation step="lab1-task2-validate" />

---

### Task 3: Create the Container Apps Environment and Managed Identity

Before creating the app containers, you need an environment to host them and a managed identity they can use to access Azure services.

#### Create the Container Apps Environment

1. Search for **Container Apps Environments** and open it.

   ![](./media/lab1/image024.png)

1. Click **+ Create** and enter the required values for your environment name and region.

   ![](./media/lab1/image025.png)

1. Use the default networking settings unless your lab environment explicitly instructs you otherwise. Then click **Review + Create** and **Create**.

   ![](./media/lab1/image1-25.png)

#### Create the Managed Identity

1. Search for **Managed Identities** and open it.

   ![](./media/lab1/image26.png)

1. Click **+ Create** and enter the resource group, identity name, and region.

   ![](./media/lab1/image27.png)

1. Complete the deployment.

   ![](./media/lab1/image28.png)

1. Open the managed identity resource.

   ![](./media/lab1/image29.png)

1. Copy and save the **Client ID** and **Object ID**.

   ![](./media/lab1/image30.png)

> **Congratulations** on completing the task! Now, it's time to validate it. Here are the steps:
> - If you receive a success message, you can proceed to the next task.

<validation step="lab1-task3-validate" />

---

### Task 4: Create the Backend and MCP Container Apps

The backend Container App hosts the Dream Team FastAPI application. The MCP Container App hosts the MCP server used by the backend.

> **Note:** `If the Docker images are not yet in Azure Container Registry, you can create the Container Apps now and update the image later in Lab 3 after you build and push the containers.`

#### Create the Backend Container App

1. Search for **Container Apps** and open it.

   ![](./media/lab1/image31.png)

1. Click **+ Create** and choose **Container App**.

   ![](./media/lab1/image32.png)

1. On the **Basics** tab, enter the subscription, resource group, app name `backend`, region, and select the Container Apps Environment you created earlier.

   ![](./media/lab1/image33.png)

1. On the **Container** tab, choose **Azure Container Registry** as the image source. If the backend image already exists in ACR, select it. Otherwise keep the quickstart image for now and update it later.

   ![](./media/lab1/image34.png)

1. On the **Ingress** tab, enable ingress, allow traffic from anywhere, and set the target port to `3100`.

   ![](./media/lab1/image35.png)

1. Complete the deployment.

   ![](./media/lab1/image36.png)

1. Open the created app.

   ![](./media/lab1/image37.png)

1. Copy and save the **Application URL** for the backend.

   ![](./media/lab1/image38.png)

#### Create the MCP Container App

1. Repeat the same flow and create a second Container App named `mcpserver`.

   ![](./media/lab1/image31.png)

   ![](./media/lab1/image32.png)

1. Use the same Container Apps Environment and region.

   ![](./media/lab1/image33.png)

1. Select the MCP image from Azure Container Registry if it already exists. Otherwise use a temporary image and update it later in Lab 3.

   ![](./media/lab1/image34.png)

1. Enable ingress and set the target port to `3100`.

   ![](./media/lab1/image35.png)

1. Complete the deployment and copy the **Application URL** for the MCP app.

   ![](./media/lab1/image36.png)

   ![](./media/lab1/image37.png)

   ![](./media/lab1/image38.png)

> **Congratulations** on completing the task! Now, it's time to validate it. Here are the steps:
> - If you receive a success message, you can proceed to the next task.

<validation step="lab1-task4-validate" />

---

### Task 5: Create the Static Web App

1. Search for **Static Web Apps** and open it.

   ![](./media/lab1/image39.png)

1. Click **+ Create**.

   ![](./media/lab1/image40.png)

1. Enter the required values for your subscription, resource group, app name, plan, and source type.

   ![](./media/lab1/image41.png)

1. Complete the deployment.

   ![](./media/lab1/image42.png)

1. Open the Static Web App.

   ![](./media/lab1/image43.png)

1. Copy and save the application URL.

   ![](./media/lab1/image45.png)

1. Open **Manage deployment token** and copy the deployment token.

   ![](./media/lab1/image46.png)

> **Congratulations** on completing the task! Now, it's time to validate it. Here are the steps:
> - If you receive a success message, you can proceed to the next task.

<validation step="lab1-task5-validate" />

---

### Task 6: Assign Required Permissions and Configure the Apps

Now connect the learner-created resources to the pre-provisioned foundation resources.

#### Part A: Assign IAM Roles to the Managed Identity

Assign the following roles to the user-assigned managed identity you created:

- `AcrPull` on Azure Container Registry
- `Storage Blob Data Contributor` on Storage Account
- `Search Service Contributor` on Azure AI Search
- `Search Index Data Contributor` on Azure AI Search
- `Cosmos DB Built-in Data Contributor` on Cosmos DB

1. Open **Container Registry** and add the `AcrPull` role assignment for the managed identity.

   ![](./media/lab1/image63.png)

   ![](./media/lab1/image64.png)

   ![](./media/lab1/image65.png)

   ![](./media/lab1/image66.png)

1. Open **Storage Account** and add the `Storage Blob Data Contributor` role assignment for the same managed identity.

   ![](./media/lab1/image70.png)

   ![](./media/lab1/image71.png)

   ![](./media/lab1/image72.png)

   ![](./media/lab1/image73.png)

> **Note:** `Some learner environments may complete Cosmos DB or AI Search access in Lab 3 by Azure CLI. Follow your delivery instructions if those assignments are split between portal and CLI.`

#### Part B: Configure Environment Variables on the Backend Container App

1. Open the **backend** Container App and go to **Containers** or **Environment variables**.

   ![](./media/lab1/image74.png)

1. Add the environment variables needed by the app. Use values you collected earlier plus the learner-created URLs:

| Variable Name | Value |
|---|---|
| `AZURE_OPENAI_ENDPOINT` | Your Azure OpenAI endpoint |
| `AZURE_OPENAI_EMBEDDING_MODEL` | `text-embedding-3-large` |
| `AZURE_SEARCH_SERVICE_ENDPOINT` | Your AI Search endpoint |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Your App Insights connection string |
| `COSMOS_DB_URI` | Your Cosmos DB URI |
| `COSMOS_DB_DATABASE` | `ag_demo` |
| `CONTAINER_NAME` | `ag_demo` |
| `CONTAINER_TEAMS_NAME` | `agent_teams` |
| `AZURE_STORAGE_ACCOUNT_ENDPOINT` | Your storage blob endpoint |
| `AZURE_STORAGE_ACCOUNT_ID` | Your storage account resource ID |
| `POOL_MANAGEMENT_ENDPOINT` | Your session pool endpoint, if used |
| `AZURE_CLIENT_ID` | Managed identity client ID |
| `UAMI_RESOURCE_ID` | Managed identity resource ID |
| `MCP_SERVER_URI` | The MCP Container App URL |
| `MCP_SERVER_API_KEY` | A shared API key value used by backend and MCP |

1. Save the configuration as a new revision and wait for the revision deployment to complete.

If your environment also sets environment variables on the `mcpserver` app, add at minimum:

- `AZURE_CLIENT_ID`
- `UAMI_RESOURCE_ID`
- `MCP_SERVER_API_KEY`

> **Congratulations** on completing the task! Now, it's time to validate it. Here are the steps:
> - If you receive a success message, you can proceed to the next task.

<validation step="lab1-task6-validate" />

---

### Task 7: Collect All Values Needed for Labs 2-4

Use this table as your reference for the remaining labs.

| Variable Name | Where to Find It | Your Value |
|---|---|---|
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI -> Keys and Endpoint | |
| `AZURE_OPENAI_DEPLOYMENT` | Foundry deployment name | `gpt-4o` |
| `AZURE_OPENAI_DEPLOYMENT_MINI` | Foundry deployment name | `gpt-4o-mini` |
| `AZURE_OPENAI_DEPLOYMENT_EMBEDDING` | Foundry deployment name | `text-embedding-3-large` |
| `AZURE_SEARCH_SERVICE_ENDPOINT` | AI Search overview | |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Application Insights overview | |
| `ACR_LOGIN_SERVER` | Container Registry overview | |
| `COSMOS_DB_URI` | Cosmos DB keys page | |
| `AZURE_STORAGE_ACCOUNT_ENDPOINT` | Storage account blob endpoint | |
| `AZURE_STORAGE_ACCOUNT_ID` | Storage account resource ID | |
| `POOL_MANAGEMENT_ENDPOINT` | Session Pool overview, if used | |
| `IDENTITY_CLIENT_ID` | Managed identity overview | |
| `IDENTITY_OBJECT_ID` | Managed identity overview | |
| `BACKEND_URL` | Backend Container App overview | |
| `MCP_SERVER_URL` | MCP Container App overview | |
| `STATIC_WEB_APP_URL` | Static Web App overview | |
| `SWA_DEPLOYMENT_TOKEN` | Static Web App deployment token | |

> **Congratulations** on completing the task! Now, it's time to validate it. Here are the steps:
> - If you receive a success message, you can proceed to the next task.

<validation step="lab1-task7-validate" />

---

## Review

In this exercise you created the app-specific Azure resources for the Dream Team solution and connected them to the pre-provisioned foundation resources. You created Azure OpenAI and its model deployments, set up the Container Apps hosting environment, created the managed identity, created the backend and MCP Container Apps, created the Static Web App, and gathered the values required for the remaining labs.

Successfully completed the following tasks:

- Reviewed the pre-provisioned foundation resources
- Created Azure OpenAI and deployed `gpt-4o`, `gpt-4o-mini`, and `text-embedding-3-large`
- Created the Container Apps Environment and Managed Identity
- Created the backend and MCP Container Apps
- Created the Static Web App
- Assigned the required permissions and configured the app resources
- Collected the values needed for Labs 2-4

## Final Resource Split

### Pre-provisioned Resources

- Resource Group
- Log Analytics Workspace
- Application Insights
- Azure Container Registry
- Key Vault
- Cosmos DB
- Azure AI Search
- Storage Account
- Session Pool, if used in your environment

### Learner-created Resources

- Azure OpenAI resource
- Model deployments: `gpt-4o`, `gpt-4o-mini`, `text-embedding-3-large`
- Container Apps Environment
- User-assigned Managed Identity
- Backend Container App
- MCP Container App
- Static Web App
- Required role assignments
- Application configuration values

**You have successfully completed Exercise 1. Click on Next >>**
