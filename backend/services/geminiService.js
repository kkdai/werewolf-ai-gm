// werewolf-ai-gm/backend/services/geminiService.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let textModel;
let imageModel;

if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY") {
  console.error("******************************************************************");
  console.error("** 警告：GEMINI_API_KEY 未設定或仍為預設值。                 **");
  console.error("** 應用程式將以 GM 的預設文本運行。                         **");
  console.error("** 請在 werewolf-ai-gm/backend/.env 檔案中設定您的金鑰。      **");
  console.error("******************************************************************");
} else {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  try {
    // 使用用戶指定的模型 ID
    textModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
    imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" }); 
  } catch (error) {
    console.error("初始化 GoogleGenerativeAI 失敗。請檢查您的 API 金鑰。", error);
    textModel = null;
    imageModel = null;
  }
}

/**
 * Generates game narration or other text content using the Gemini API.
 * @param {string} promptText - The prompt to send to Gemini.
 * @param {string} [fallbackText] - Optional fallback text if API call fails or is disabled.
 * @returns {Promise<string>} - The generated text or a fallback.
 */
async function getGameNarration(promptText, fallbackText = "GM 處於沉思中...") {
  if (!textModel) {
    console.log("Gemini 文字模型不可用，使用預設文本。");
    return fallbackText;
  }
  try {
    console.log("傳送文字提示到 Gemini：", promptText);
    const result = await textModel.generateContent(promptText);
    const response = await result.response;
    const text = response.text();
    console.log("從 Gemini 收到文本：", text);
    return text;
  } catch (error) {
    console.error("呼叫 Gemini Text API 時發生錯誤：", error);
    return `(GM 錯誤：靈魂們陷入沉默。無法連接至 Gemini 領域。詳情: ${error.message})`;
  }
}

/**
 * Generates an image using the specified Gemini Image API and returns it as a Data URL.
 * @param {string} promptText - The prompt for image generation.
 * @returns {Promise<string>} - A Data URL string (e.g., "data:image/png;base64,...").
 */
async function generateGameImage(promptText) {
    if (!imageModel) {
        console.log("Gemini 圖片模型不可用，返回一個空白圖片。");
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }
    try {
        console.log("傳送圖片提示到 Gemini 圖片模型：", promptText);
        
        const result = await imageModel.generateContent([promptText]);
        const response = await result.response;

        // 增加防禦性檢查：確認 API 是否真的回傳了圖片資料
        if (!response.parts || response.parts.length === 0) {
            console.error("Gemini API 未回傳有效的圖片 'parts'。可能是因為內容審核或提示詞問題。");
            console.error("完整的 API 回應:", JSON.stringify(response, null, 2));
            throw new Error("API response did not contain any parts.");
        }

        // 從 API 回應中提取 Base64 圖片資料和 MIME 類型
        const firstPart = response.parts[0];
        if (firstPart.inlineData && firstPart.inlineData.data) {
            const base64Data = firstPart.inlineData.data;
            const mimeType = firstPart.inlineData.mimeType;

            console.log(`從 Gemini 圖片模型成功接收到圖片資料 (類型: ${mimeType})。`);
            
            // 構建並返回正確的 Data URL
            const dataUrl = `data:${mimeType};base64,${base64Data}`;
            return dataUrl;
        } else {
            throw new Error("API 回應中未找到 'inlineData'。");
        }

    } catch (error) {
        console.error("呼叫 Gemini Image API 時發生嚴重錯誤：", error);
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // 返回一個空白/錯誤圖片
    }
}

module.exports = {
  getGameNarration,
  generateGameImage,
};