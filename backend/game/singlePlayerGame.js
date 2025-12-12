// werewolf-ai-gm/backend/game/singlePlayerGame.js
const { generateAICharacters, assignRoles } = require('./gameLogic');
const { getGameNarration, generateGameImage, generateOpeningImage } = require('../services/geminiService');

const TOTAL_PLAYERS = 12;
const AI_PLAYER_COUNT = 11;

async function handleGameAction({ action, payload, gameState }) {
    switch (action) {
        case 'START_GAME':
            return await initializeGame(payload.playerName);
        
        case 'PLAYER_TALK':
            return await handlePlayerTalk(gameState, payload.text);

        case 'PROGRESS_TO_NEXT_DAY': // We keep this for now for simple testing
            return await progressToNextDay(gameState);

        default:
            return { ...gameState, narrativeLog: [...(gameState.narrativeLog || []), { sender: 'GM', message: `(錯誤) 未知的動作: ${action}` }] };
    }
}

async function initializeGame(humanPlayerName = "玩家") {
    // 1. Generate Dynamic Context
    const SEASONS = ["嚴酷的冬天", "潮濕的春天", "炎熱的夏天", "蕭瑟的秋天"];
    const TIMES_OF_DAY = ["清晨", "正午", "黃昏", "深夜"];
    const LOCATIONS = ["村莊廣場", "破舊的酒館", "教堂墓園", "森林邊緣"];

    const season = SEASONS[Math.floor(Math.random() * SEASONS.length)];
    const time = TIMES_OF_DAY[Math.floor(Math.random() * TIMES_OF_DAY.length)];
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

    // 2. Generate Characters and Roles
    const aiCharacters = generateAICharacters(AI_PLAYER_COUNT);
    const assignedRoles = assignRoles(TOTAL_PLAYERS);
    
    const humanPlayerObject = { name: humanPlayerName, personality: "一個試圖在混亂中找出真相的局外人。", isHuman: true };
    const allCharacters = [humanPlayerObject, ...aiCharacters];

    const characters = allCharacters.map((char, index) => ({
        ...char,
        role: assignedRoles[index],
        status: 'alive',
    }));

    // 3. Create initial game state and store context
    let initialGameState = {
        characters,
        survivors: characters.map(c => c.name),
        day: 1,
        phase: 'discussion',
        context: { season, time, location }, // Store the generated context
        narrativeLog: [],
        gameOver: false,
        winner: null,
        imageUrl: null,
        eventImageUrl: null,
    };

    // 4. Generate unique background story with Gemini
    const storyPrompt = `你是一位才華洋溢的說書人。請為一場狼人殺遊戲生成一段獨特、引人入勝的背景故事。
    故事背景設定在一個中世紀村莊，當前的情境是：季節為'${season}'，時間在'${time}'，地點位於'${location}'。
    請用2-3句話，營造出懸疑、神秘的氣氛。`;
    const backgroundStory = await getGameNarration(storyPrompt, "一個古老的故事在此地流傳...");
    initialGameState.narrativeLog.push({ sender: 'GM', message: backgroundStory });
    initialGameState.narrativeLog.push({ sender: 'GM', message: `第一天的${time}，你們聚集於此...` });


    // 5. Dynamically generate the main image prompt (使用 Imagen 以獲得更快的生成速度)
    const imagePrompt = `一張精美的狼人殺主題插畫。風格為黑暗奇幻油畫。
    場景：季節是'${season}'，時間是'${time}'。在'${location}'，包含玩家'${humanPlayerName}'在內的12名角色聚集在一起。他們神情可疑，氣氛緊張。`;
    initialGameState.imageUrl = await generateOpeningImage(imagePrompt);

    // 6. Generate event image (e.g., player's role reveal) (使用 Imagen 以獲得更快的生成速度)
    const humanPlayer = characters.find(c => c.isHuman);
    const eventImagePrompt = `一張充滿戲劇性的角色特寫藝術圖。特寫 '${humanPlayer.name}' 的臉，他的角色是 ${humanPlayer.role}。他的表情堅定，背景中巧妙地融入了代表其角色身份的元素。數位藝術風格，高對比度。`;
    initialGameState.eventImageUrl = await generateOpeningImage(eventImagePrompt);

    return initialGameState;
}

async function handlePlayerTalk(gameState, playerText) {
    let newState = JSON.parse(JSON.stringify(gameState));
    
    // Add player's message to the log
    newState.narrativeLog.push({ sender: gameState.characters.find(c => c.isHuman).name, message: playerText });

    // Construct the prompt for Gemini to generate AI discussion
    const aliveCharacters = newState.characters.filter(c => c.status === 'alive');
    const characterDescriptions = aliveCharacters.map(c => 
        `- ${c.name} (性格: ${c.personality})`
    ).join('\n');

    const discussionPrompt = `你是狼人殺的遊戲主持人(GM)。現在是第 ${newState.day} 天的討論環節。
存活的角色如下：
${characterDescriptions}

剛才，玩家 '${newState.characters.find(c => c.isHuman).name}' 說了：'${playerText}'

請你根據每個AI角色的性格，模擬接下來的討論。
規則：
1. 選擇2到3位AI角色對玩家的發言做出回應。
2. 他們的回應必須完全符合自己的性格。
3. 讓他們之間可能產生一些簡短的互動（例如，亞瑟可能反駁馬可的自私言論）。
4. 最後，用GM的身份做一個簡短的總結，並提示玩家下一步該做什麼（例如：提醒玩家思考並準備投票）。
5. 你的回覆必須是純粹的對話和GM旁白，不要有額外的格式。直接返回對話內容。`;

    const discussionResult = await getGameNarration(discussionPrompt, "AI 角色們陷入了沉默...");
    newState.narrativeLog.push({ sender: 'GM', message: discussionResult });

    // Optionally, update the main image based on the discussion
    const imagePrompt = `黑暗奇幻油畫。場景：在村莊廣場上，存活的村民們正在激烈地討論，氣氛緊張。根據對話'${playerText}'，'${discussionResult}'，有些人在指責，有些人很害怕。`;
    newState.imageUrl = await generateGameImage(imagePrompt);

    newState.phase = 'voting'; // Transition to voting phase

    return newState;
}


async function progressToNextDay(gameState) {
    let newState = JSON.parse(JSON.stringify(gameState));
    newState.eventImageUrl = null; 

    const aliveAI = newState.characters.filter(c => !c.isHuman && c.status === 'alive');
    if (aliveAI.length === 0) { 
        newState.gameOver = true;
        newState.narrativeLog.push({ sender: 'GM', message: "沒有更多目標了。遊戲結束。" });
        return newState;
    }
    
    const target = aliveAI.find(c => c.role === 'Villager') || aliveAI[0];
    target.status = 'dead';
    newState.characters.find(c => c.name === target.name).status = 'dead';
    newState.survivors = newState.characters.filter(c => c.status === 'alive').map(c => c.name);

    newState.day += 1;
    newState.phase = 'discussion';
    const narrativePrompt = `第 ${newState.day} 天黎明，村民們充滿恐懼地聚集在廣場上。他們發現 '${target.name}' 昨晚被淘汰了。請描述這個殘酷的發現，並揭示他的角色是 '${target.role}'。(最多2-3句話)`;
    newState.narrativeLog.push({ sender: 'GM', message: await getGameNarration(narrativePrompt) });

    const imagePrompt = `黑暗奇幻油畫。倖存的村民們震驚且懷疑地聚集在鎮上的井邊。'${target.name}' 的屍體蓋著布躺在地上。氣氛緊張。`;
    newState.imageUrl = await generateGameImage(imagePrompt);

    const eventImagePrompt = `一幅陰鬱、充滿情感的特寫數位繪畫，聚焦於被淘汰角色 '${target.name}' 遺留下來的物品。這個物品，例如一個掉落的掛墜盒或一本磨損的書，象徵著他的角色是 ${target.role}。背景模糊而黑暗。`;
    newState.eventImageUrl = await generateGameImage(eventImagePrompt);

    return newState;
}

module.exports = { handleGameAction };
