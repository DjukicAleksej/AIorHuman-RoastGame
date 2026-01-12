require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const OpenAI = require('openai');

const app = express();
const port = 5000;


app.get('/', (req, res) => {
    res.send('Roast Game Backend is live!');
});

const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})

//websocket server
const wss = new WebSocketServer({ server });

const games = {}; // gameid: { players: [], roasts: [] }

wss.on('connection', (ws) => {
    console.log('New client connected');
})