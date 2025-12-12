# Cloud Run 部署檢查清單

使用此檢查清單確保部署成功。

## 部署前準備

- [ ] 已有 GCP 專案並設定計費
- [ ] 已取得 Gemini API 金鑰
- [ ] 程式碼已推送到 GitHub
- [ ] 已在本地測試應用程式運作正常

## GCP 設定

- [ ] 啟用必要的 API：
  ```bash
  gcloud services enable cloudbuild.googleapis.com
  gcloud services enable run.googleapis.com
  gcloud services enable containerregistry.googleapis.com
  gcloud services enable secretmanager.googleapis.com
  ```

- [ ] 在 Secret Manager 中儲存 Gemini API 金鑰：
  ```bash
  echo -n "YOUR_API_KEY" | gcloud secrets create GEMINI_API_KEY \
      --data-file=- --replication-policy="automatic"
  ```

- [ ] 授予 Cloud Run 存取 Secret 的權限：
  ```bash
  PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
  gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
      --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
      --role="roles/secretmanager.secretAccessor"
  ```

## Cloud Build 設定

- [ ] 連接 GitHub repository 到 Cloud Build
- [ ] 建立 Cloud Build Trigger：
  - 名稱: `werewolf-ai-gm-deploy`
  - 觸發條件: 推送到 `main` 分支
  - 設定檔: `/cloudbuild.yaml`

- [ ] 檢查 `cloudbuild.yaml` 中的區域設定（預設: asia-east1）

## 首次部署

- [ ] 推送程式碼觸發自動部署，或手動執行：
  ```bash
  git push origin main
  ```

- [ ] 在 Cloud Build 控制台檢查構建狀態
- [ ] 等待部署完成（約 3-5 分鐘）

## 部署驗證

- [ ] 取得 Cloud Run URL
- [ ] 測試健康檢查端點：
  ```bash
  curl https://YOUR-URL/api/health
  ```

- [ ] 在瀏覽器中開啟應用程式
- [ ] 測試遊戲流程：
  - [ ] 輸入玩家名稱
  - [ ] 開始遊戲
  - [ ] 確認 AI 回應正常
  - [ ] 確認圖片生成正常

## 監控設定

- [ ] 設定 Cloud Run 監控警報
- [ ] 查看日誌確認無錯誤
- [ ] 檢查 Gemini API 使用量

## 成本優化

- [ ] 檢查 Cloud Run 實例數設定
- [ ] 確認記憶體和 CPU 配置合理
- [ ] 設定預算警報

## 故障排除

如果遇到問題：

1. **構建失敗**: 檢查 Cloud Build 日誌
2. **無法存取**: 確認服務允許未經驗證的存取
3. **API 錯誤**: 檢查 Secret Manager 權限和金鑰正確性
4. **效能問題**: 調整 Cloud Run 資源配置

詳細資訊請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)
