// werewolf-ai-gm/backend/services/geminiService.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let textModel;
let imageModel;

if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY" || GEMINI_API_KEY === "your_gemini_api_key_here") {
  console.error("******************************************************************");
  console.error("** 警告：GEMINI_API_KEY 未設定或仍為預設值。                 **");
  console.error("** 應用程式將以 GM 的預設文本運行。                         **");
  console.error("** 請在 werewolf-ai-gm/backend/.env 檔案中設定您的金鑰。      **");
  console.error("******************************************************************");
} else {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  try {
    // 使用 Gemini 2.0 Flash 模型處理文字
    textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    // 使用 Gemini 2.5 Flash Image 模型處理圖片生成
    imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    console.log("✓ Gemini 文字模型初始化成功 (gemini-2.0-flash)");
    console.log("✓ Gemini 圖片模型初始化成功 (gemini-2.5-flash-image)");
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
 * Generates an image using the Gemini 2.5 Flash Image model and returns it as a Data URL.
 * @param {string} promptText - The prompt for image generation.
 * @returns {Promise<string>} - A Data URL string (e.g., "data:image/png;base64,...").
 */
async function generateGameImage(promptText) {
    if (!imageModel) {
        console.log("Gemini 圖片模型不可用，返回佔位符圖片。");
        return createPlaceholderImage();
    }
    try {
        console.log("傳送圖片提示到 Gemini 圖片模型 (gemini-2.5-flash-image)：", promptText.substring(0, 100) + "...");

        // 使用較小的圖片尺寸以加快生成速度
        // aspectRatio: 4:3 (適合遊戲場景顯示)
        const result = await imageModel.generateContent({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
                imageConfig: {
                    aspectRatio: "4:3"  // 使用 4:3 比例，較小且適合遊戲
                }
            }
        });
        const response = await result.response;

        // 檢查 API 是否回傳了資料
        if (!response.candidates || response.candidates.length === 0) {
            console.log("ℹ API 未回傳任何候選結果，使用佔位符。");
            return createPlaceholderImage();
        }

        const candidate = response.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            console.log("ℹ API 回應中未找到 parts，使用佔位符。");
            return createPlaceholderImage();
        }

        // 遍歷所有 parts，尋找 inlineData（圖片數據）
        // response 可能同時包含 text 和 inlineData
        for (const part of candidate.content.parts) {
            if (part.text) {
                console.log("ℹ Gemini 回傳文字：", part.text.substring(0, 100));
            }

            if (part.inlineData && part.inlineData.data) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';

                console.log(`✓ 從 Gemini 圖片模型成功接收到圖片資料 (類型: ${mimeType})`);

                // 構建並返回正確的 Data URL
                const dataUrl = `data:${mimeType};base64,${base64Data}`;
                return dataUrl;
            }
        }

        // 如果沒有找到 inlineData，使用佔位符
        console.log("ℹ API 回應中未找到圖片資料，使用佔位符。");
        return createPlaceholderImage();

    } catch (error) {
        console.error("呼叫 Gemini Image API 時發生錯誤：", error.message);
        return createPlaceholderImage();
    }
}

/**
 * Creates a placeholder SVG image.
 * @returns {string} - A Data URL string with a placeholder SVG image.
 */
function createPlaceholderImage() {
    const svg = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="800" height="600" fill="url(#grad1)"/>
            <text x="400" y="280" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle">
                🎭 AI 狼人殺
            </text>
            <text x="400" y="320" font-family="Arial, sans-serif" font-size="16" fill="#aaaaaa" text-anchor="middle">
                圖片佔位符
            </text>
            <text x="400" y="350" font-family="Arial, sans-serif" font-size="12" fill="#666666" text-anchor="middle">
                (圖片生成中...)
            </text>
        </svg>
    `;
    const base64Svg = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64Svg}`;
}

module.exports = {
  getGameNarration,
  generateGameImage,
};