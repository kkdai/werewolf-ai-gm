// werewolf-ai-gm/backend/server.js
const express = require('express');
const cors = require('cors');
const { handleGameAction } = require('./game/singlePlayerGame');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Allow requests from our frontend
app.use(express.json()); // Parse JSON bodies

// --- Routes ---

// A single endpoint to handle all game actions
app.post('/api/game/action', async (req, res) => {
    try {
        const { action, payload, gameState } = req.body;
        
        // The handleGameAction function is now the single entry point for all game logic
        const nextState = await handleGameAction({ action, payload, gameState });

        res.json(nextState);

    } catch (error) {
        console.error('處理遊戲動作時發生錯誤：', error);
        res.status(500).json({ error: '伺服器內部發生錯誤。' });
    }
});

// A simple health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).send('伺服器運行中');
});


// Start the server
app.listen(PORT, () => {
    console.log(`伺服器正在監聽連接埠 ${PORT}`);
});
