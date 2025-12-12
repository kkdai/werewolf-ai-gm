# 部署到 GCP Cloud Run 指南

本指南說明如何將 AI 狼人殺 GM 應用程式部署到 Google Cloud Platform 的 Cloud Run。

## 前置需求

1. Google Cloud Platform 帳號
2. 已啟用的 GCP 專案
3. GitHub 帳號（用於連接 Cloud Build）
4. Gemini API 金鑰

## 初始設定

### 1. 啟用必要的 GCP API

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. 在 Secret Manager 中儲存 Gemini API 金鑰

```bash
# 將你的 Gemini API 金鑰儲存為 secret
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY \
    --data-file=- \
    --replication-policy="automatic"

# 授予 Cloud Run 存取 secret 的權限
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## 部署方式

### 方式一：使用 GitHub 與 Cloud Build 自動部署（推薦）

#### 步驟 1：連接 GitHub Repository

1. 前往 [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. 點擊「連接存放區」
3. 選擇 GitHub 並授權
4. 選擇你的 werewolf-ai-gm repository

#### 步驟 2：建立 Cloud Build Trigger

1. 點擊「建立觸發條件」
2. 設定以下選項：
   - **名稱**: `werewolf-ai-gm-deploy`
   - **事件**: 推送到分支
   - **來源**: 選擇你的 repository
   - **分支**: `^main$` 或 `^master$`
   - **設定**: Cloud Build 設定檔 (yaml 或 json)
   - **Cloud Build 設定檔位置**: `/cloudbuild.yaml`

3. 點擊「建立」

#### 步驟 3：觸發部署

現在，每次推送到 main/master 分支時，Cloud Build 會自動：
1. 構建 Docker 映像
2. 推送到 Container Registry
3. 部署到 Cloud Run

手動觸發第一次部署：
```bash
git push origin main
```

或在 Cloud Build 控制台手動執行觸發條件。

### 方式二：本地手動部署

如果需要手動從本地部署：

```bash
# 設定專案 ID
PROJECT_ID=your-gcp-project-id
gcloud config set project $PROJECT_ID

# 構建並推送映像
gcloud builds submit --tag gcr.io/$PROJECT_ID/werewolf-ai-gm

# 部署到 Cloud Run
gcloud run deploy werewolf-ai-gm \
    --image gcr.io/$PROJECT_ID/werewolf-ai-gm \
    --platform managed \
    --region asia-east1 \
    --allow-unauthenticated \
    --set-env-vars NODE_ENV=production \
    --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 300
```

## 設定調整

### 修改 Cloud Run 配置

你可以在 `cloudbuild.yaml` 中調整以下設定：

- **region**: 部署區域（預設: `asia-east1`）
- **memory**: 記憶體配置（預設: `512Mi`）
- **cpu**: CPU 配置（預設: `1`）
- **max-instances**: 最大實例數（預設: `10`）
- **timeout**: 請求逾時時間（預設: `300` 秒）

### 更新 Gemini API 金鑰

```bash
# 更新 secret
echo -n "NEW_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 重新部署服務以使用新的 secret 版本
gcloud run services update werewolf-ai-gm --region asia-east1
```

## 驗證部署

部署完成後，你會獲得一個 Cloud Run URL，例如：
```
https://werewolf-ai-gm-xxxxxxxxx-de.a.run.app
```

測試 API：
```bash
curl https://YOUR-CLOUD-RUN-URL/api/health
```

在瀏覽器中開啟 URL 即可使用應用程式。

## 監控與日誌

### 查看日誌
```bash
gcloud run services logs read werewolf-ai-gm --region asia-east1 --limit 50
```

### 在控制台查看
前往 [Cloud Run 控制台](https://console.cloud.google.com/run) 查看：
- 服務狀態
- 請求量
- 延遲
- 錯誤率

## 成本估算

Cloud Run 採用按使用量計費：
- 前 200 萬次請求免費
- CPU: $0.00002400/vCPU-秒
- 記憶體: $0.00000250/GiB-秒
- 僅在處理請求時計費

估算工具：https://cloud.google.com/products/calculator

## 故障排除

### 構建失敗
檢查 Cloud Build 日誌：
```bash
gcloud builds list --limit 5
gcloud builds log BUILD_ID
```

### 部署後無法存取
1. 檢查 Cloud Run 服務是否允許未經身份驗證的存取
2. 檢查 Secret Manager 權限
3. 查看 Cloud Run 日誌中的錯誤

### Gemini API 錯誤
確認：
1. API 金鑰正確儲存在 Secret Manager
2. Cloud Run 有權限存取 secret
3. Gemini API 配額未超過

## 回滾

如需回滾到先前版本：
```bash
# 查看所有版本
gcloud run revisions list --service werewolf-ai-gm --region asia-east1

# 回滾到特定版本
gcloud run services update-traffic werewolf-ai-gm \
    --to-revisions REVISION_NAME=100 \
    --region asia-east1
```

## 清理資源

如需刪除所有資源：
```bash
# 刪除 Cloud Run 服務
gcloud run services delete werewolf-ai-gm --region asia-east1

# 刪除 Container Registry 映像
gcloud container images delete gcr.io/$PROJECT_ID/werewolf-ai-gm --quiet

# 刪除 Secret
gcloud secrets delete GEMINI_API_KEY --quiet
```

## 參考資源

- [Cloud Run 文件](https://cloud.google.com/run/docs)
- [Cloud Build 文件](https://cloud.google.com/build/docs)
- [Secret Manager 文件](https://cloud.google.com/secret-manager/docs)
