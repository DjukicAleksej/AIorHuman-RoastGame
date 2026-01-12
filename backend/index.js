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

    ws.on('message', async (data) => {
        const msg = JSON.parse(data);

        switch(msg.type){
            case 'JOIN_GAME':
                const {gameId, playerName, isAI} = msg;
                if(!games[gameId]) games[gameId] = {players: [],messages: [],ai: isAI};
                games[gameId].players.push({ws, name: playerName, isAI});
                ws.send(JSON.stringify({type: 'JOINED', gameId}));
            break;

            case 'SEND_MESSAGE':
                const {gameId: gId, message, sender} = msg;
                const game = games[gId];
                if(!game) return;
        }
    })
})