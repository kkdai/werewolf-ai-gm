// werewolf-ai-gm/backend/game/gameLogic.js

const ROLES = {
    WEREWOLF: 'Werewolf',
    VILLAGER: 'Villager',
    SEER: 'Seer',
    WITCH: 'Witch',
};

// A pool of predefined characters with personalities
const CHARACTERS = [
    { name: "騎士亞瑟", personality: "勇敢、正直，有強烈的保護慾，但有時會過於衝動，容易相信他人。" },
    { name: "學者伊蓮娜", personality: "聰明、敏銳，善於分析，但有點膽小，發言謹慎，總是引用書本上的知識。" },
    { name: "商人馬可", personality: "精明、投機，凡事都從利益出發，說話時常帶有交易口吻，擅長煽動和拉攏人心。" },
    { name: "祭司賽勒斯", personality: "虔誠、冷靜，說話充滿哲理，試圖安撫大家，但有時會因為過於中立而顯得可疑。" },
    { name: "遊俠芬恩", personality: "獨來獨往，沉默寡言，對周遭環境觀察入微，只在關鍵時刻說出簡短但重要的話。" },
    { name: "吟遊詩人莉拉", personality: "樂觀、浪漫，喜歡用詩歌和故事來打比方，試圖緩和緊張氣氛，但有時顯得不夠嚴肅。" },
    { name: "鐵匠巴頓", personality: "固執、坦率，有一說一，聲音洪亮，相信眼見為實，對複雜的邏輯感到不耐煩。" },
    { name: "草藥師艾拉", personality: "溫柔、善良，關心每個人的狀況，但容易感到不安，發言時常帶有猶豫。" },
    { name: "小偷吉諾", personality: "狡猾、機靈，說話時眼神閃爍，擅長轉移話題和混淆視聽，有著街頭智慧。" },
    { name: "女爵卡珊卓", personality: "高傲、有領袖氣質，說話帶有命令口吻，試圖掌控討論的走向，不輕易認錯。" },
    { name: "老兵漢克", personality: "經驗豐富，多疑，不信任任何人，發言時總是指出現實的殘酷，語氣充滿警惕。" },
    { name: "農夫提米", personality: "樸實、憨厚，發言不多，邏輯簡單，容易被他人說服，代表著普通村民的視角。" }
];


/**
 * Generates a list of AI characters with their personalities.
 * @param {number} count - The number of characters to generate.
 * @returns {object[]} An array of unique random character objects.
 */
function generateAICharacters(count) {
    const shuffled = [...CHARACTERS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/**
 * Generates roles for a given number of players in a single-player game.
 * @param {number} totalPlayers - The total number of players (including the human).
 * @returns {string[]} A shuffled array of role strings.
 */
function assignRoles(totalPlayers) {
    const roles = [];
    
    if (totalPlayers === 12) {
        roles.push(ROLES.WEREWOLF, ROLES.WEREWOLF, ROLES.WEREWOLF);
        roles.push(ROLES.SEER);
        roles.push(ROLES.WITCH);
        while (roles.length < 12) {
            roles.push(ROLES.VILLAGER);
        }
    } else {
        roles.push(ROLES.WEREWOLF);
        while (roles.length < totalPlayers) {
            roles.push(ROLES.VILLAGER);
        }
    }

    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    
    return roles;
}

module.exports = {
    ROLES,
    generateAICharacters,
    assignRoles,
};