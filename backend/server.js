// werewolf-ai-gm/backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { handleGameAction } = require('./game/singlePlayerGame');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Allow requests from our frontend
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with larger limit for images
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Parse URL-encoded bodies

// Serve static files from frontend build (for production deployment)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

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

// SPA fallback - serve index.html for all non-API routes (only in production)
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        // Skip if it's an API route
        if (req.path.startsWith('/api/')) {
            return next();
        }
        // Serve index.html for all other routes
        res.sendFile(path.join(publicPath, 'index.html'));
    });
}

// Start the server
app.listen(PORT, () => {
    console.log(`Hello from Cloud Run! The container started successfully and is listening for HTTP requests on port ${PORT}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`Public path: ${publicPath}`);

    // Log files in public directory for debugging
    const fs = require('fs');
    try {
        const files = fs.readdirSync(publicPath);
        console.log(`Files in public directory: ${files.join(', ')}`);
        if (files.includes('assets')) {
            const assetFiles = fs.readdirSync(path.join(publicPath, 'assets'));
            console.log(`Files in assets directory: ${assetFiles.join(', ')}`);
        }
    } catch (err) {
        console.error(`Error reading public directory: ${err.message}`);
    }
});
