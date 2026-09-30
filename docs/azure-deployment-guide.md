# Complete Azure Deployment Guide for NexusRAG

This guide explains how to deploy the **NexusRAG** platform to **Microsoft Azure**.

---

## 🏛️ Recommended Architecture on Azure

```
┌─────────────────────────────────┐
│     Azure Static Web Apps       │ ◄── Frontend React (Vite) UI
│  (Free tier, global CDN & SSL)  │
└────────────────┬────────────────┘
                 │ REST / API Calls
                 ▼
┌─────────────────────────────────┐
│        Azure App Service        │ ◄── Backend Spring Boot 3.3 (Java 21)
│   (Linux, B1 or F1 Free tier)   │     https://ragplatform-app.azurewebsites.net
└────────┬───────────────┬────────┘
         │               │
         ▼               ▼
┌────────────────┐ ┌────────────────┐
│ Neon Postgres  │ │ Upstash Redis  │
│ (with pgvector)│ │ (Rate limit &  │
│                │ │  chat history) │
└────────────────┘ └────────────────┘
```

---

## Part 1: Deploying the Backend to Azure App Service

### Option A: Using the Azure Portal (Easiest)

1. **Create the Web App**:
   * Navigate to [Azure Portal](https://portal.azure.com/) and search for **App Services**.
   * Click **Create** > **Web App**.
   * **Subscription & Resource Group**: Select or create a new resource group (e.g., `rg-nexusrag`).
   * **Name**: `ragplatform-app` (or any unique name). This gives you `https://<app-name>.azurewebsites.net`.
   * **Publish**: **Code**
   * **Runtime stack**: **Java 21**
   * **Java web server stack**: **Java SE (Embedded Web Server)**
   * **Operating System**: **Linux**
   * **Pricing Plan**: **B1 Basic** or **F1 Free**.
   * Click **Review + Create** > **Create**.

2. **Configure Environment Variables (Application Settings)**:
   * In your Web App page, go to **Settings** > **Environment variables** (or **Configuration**).
   * Under the **App settings** tab, add the following key-value pairs:
     * `NEON_DB_URL`: `jdbc:postgresql://<neon-host>/neondb?sslmode=require`
     * `NEON_DB_USER`: `<your-neon-user>`
     * `NEON_DB_PASSWORD`: `<your-neon-password>`
     * `UPSTASH_REDIS_PASSWORD`: `<your-upstash-redis-password>`
     * `GEMINI_API_KEY`: `<your-gemini-api-key>`
     * `PORT`: `8080`
   * Click **Apply** (Save).

---

### Option B: Deploying via Azure CLI

If you have the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed:

```bash
# 1. Login to Azure
az login

# 2. Create a Resource Group
az group create --name rg-nexusrag --location eastus

# 3. Create an App Service Plan (Linux)
az appservice plan create \
  --name plan-nexusrag \
  --resource-group rg-nexusrag \
  --sku B1 \
  --is-linux

# 4. Create the Web App with Java 21
az webapp create \
  --name ragplatform-app \
  --resource-group rg-nexusrag \
  --plan plan-nexusrag \
  --runtime "JAVA:21-java21"

# 5. Set Environment Variables
az webapp config appsettings set \
  --resource-group rg-nexusrag \
  --name ragplatform-app \
  --settings \
    NEON_DB_URL="jdbc:postgresql://<host>/neondb?sslmode=require" \
    NEON_DB_USER="<user>" \
    NEON_DB_PASSWORD="<password>" \
    UPSTASH_REDIS_PASSWORD="<upstash-password>" \
    GEMINI_API_KEY="<gemini-key>" \
    PORT="8080"

# 6. Deploy the packaged JAR directly
cd ragplatform
mvn clean package -DskipTests
az webapp deploy \
  --resource-group rg-nexusrag \
  --name ragplatform-app \
  --src-path target/ragplatform-0.0.1-SNAPSHOT.jar \
  --type jar
```

---

## Part 2: Deploying the Frontend to Azure Static Web Apps (Free)

Azure Static Web Apps is the ideal, free hosting solution for Vite/React applications with custom domains and SSL.

### Steps:
1. In the [Azure Portal](https://portal.azure.com/), search for **Static Web Apps** and click **Create**.
2. **Details**:
   * **Resource Group**: `rg-nexusrag`
   * **Name**: `nexusrag-ui`
   * **Plan type**: **Free**
3. **Deployment Details**:
   * Choose **GitHub** as the source and authorize your GitHub account.
   * Select your repository and `main` branch.
   * **Build Presets**: Select **Custom** (or Vite):
     * **App location**: `/ragplatform-ui`
     * **Api location**: *(leave blank)*
     * **Output location**: `dist`
4. Click **Review + Create**.
5. Azure will automatically generate a GitHub Actions workflow in `.github/workflows/` that builds and deploys your frontend on every push.

---

## Part 3: Automated CI/CD via GitHub Actions

We have created an automated deployment workflow:
[`.github/workflows/azure-deploy.yml`](../.github/workflows/azure-deploy.yml)

### Setup:
1. In Azure Portal, navigate to your **App Service (`ragplatform-app`)**.
2. Click **Get publish profile** on the top toolbar to download the `.PublishSettings` file.
3. Open the file, copy the entire XML content.
4. In your GitHub repository:
   * Go to **Settings** > **Secrets and variables** > **Actions**.
   * Click **New repository secret**.
   * Name: `AZURE_WEBAPP_PUBLISH_PROFILE`.
   * Value: Paste the XML content.
   * Click **Add secret**.
5. Now, whenever you push code to `main`, GitHub Actions will automatically package the JAR and deploy it live to Azure!
