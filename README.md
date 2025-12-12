# AI 劇本殺：視覺化狼人殺 GM (AI Werewolf Director)

這是一個實驗性專案，旨在打造一個互動式的線上狼人殺遊戲平台，其中遊戲主持人 (Game Master, GM) 的角色由 Google Gemini 模型擔任，負責遊戲邏輯判斷和敘事。在第一階段 MVP 中，GM 主要以文字形式進行引導和播報。

## 專案特色 (第一階段 MVP)

*   **AI 驅動的文字 GM**：利用 Google Gemini 的強大語言能力，自動進行遊戲邏輯判斷、角色分配、夜晚事件敘述和日間討論引導，提供沉浸式的文字體驗。
*   **即時多人連線**：使用 Socket.IO 實現前後端即時通訊，支援多名玩家加入房間進行遊戲。
*   **React 前端介面**：提供簡潔的網頁介面，用於房間管理、玩家列表顯示、遊戲日誌和基本操作。
*   **遊戲房間管理**：支援創建、加入和離開遊戲房間。
*   **基礎遊戲流程**：實現了從大廳到遊戲開始、角色分配和夜間轉換的基礎流程。

## 技術棧

*   **後端**：Node.js, Express, Socket.IO, `@google/generative-ai`
*   **前端**：React, Vite, Socket.IO-client
*   **開發工具**：`concurrently` (用於同時啟動前後端)

## 環境設定

在開始之前，請確保您已安裝 Node.js (建議 v18 或更高版本) 和 npm。

1.  **複製專案**：
    ```bash
    # 如果您還沒有這個專案目錄
    # git clone <您的專案連結>
    # cd werewolf-ai-gm
    ```
    (如果您正在使用 Gemini CLI，此步驟已完成。)

2.  **安裝依賴**：
    進入專案根目錄，安裝 `concurrently`。
    ```bash
    cd werewolf-ai-gm
    npm install
    ```
    然後進入 `backend` 和 `frontend` 目錄分別安裝各自的依賴。
    ```bash
    cd backend
    npm install
    cd ../frontend
    npm install
    cd .. # 回到專案根目錄
    ```

3.  **設定 Gemini API 金鑰**：
    *   前往 [Google AI for Developers](https://ai.google.dev/) 獲取您的 Gemini API 金鑰。
    *   在 `werewolf-ai-gm/backend/` 目錄下建立一個 `.env` 檔案。
    *   將您的 API 金鑰加入 `.env` 檔案中，格式如下：
        ```
        GEMINI_API_KEY="您的 Gemini API 金鑰"
        ```
        請將 `"您的 Gemini API 金鑰"` 替換為實際的金鑰。

## 運行專案

確保您已完成上述設定。

1.  **啟動前後端服務**：
    在專案的**根目錄** (`werewolf-ai-gm/`) 執行以下指令：
    ```bash
    npm run dev
    ```
    這個指令會同時啟動後端伺服器 (port: `4000`) 和前端開發伺服器 (port: `8080`)。

2.  **在瀏覽器中訪問**：
    打開您的網頁瀏覽器，訪問 `http://localhost:8080/`。
    為了測試多人遊戲，您可以打開多個瀏覽器分頁或視窗。

## 遊戲流程 (MVP)

1.  在首頁輸入玩家名稱，選擇「Create Room」或輸入房間 ID 「Join Room」。
2.  房間創建或加入後，GM (Gemini) 會在遊戲日誌中發送歡迎訊息。
3.  作為房主，當房間內的玩家達到最低人數後，您可以點擊「Start Game」開始遊戲。
4.  遊戲開始後，每個玩家會收到自己的角色資訊。
5.  目前遊戲會進入夜晚階段，但夜晚的具體行動和日間討論功能尚未完全實作，這是接下來的開發目標。

## 未來計畫 (第二階段)

*   實現夜晚行動邏輯 (狼人行動、預言家驗人、女巫藥水等)。
*   實作日間討論和投票機制。
*   引入 VEO 實現視覺化事件呈現。

---
