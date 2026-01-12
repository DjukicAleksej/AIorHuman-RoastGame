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

                //Broadcast msg to all players
                game.players.forEach(p => p.ws.send(JSON.stringify({
                    type: 'NEW_MESSAGE',
                    sender,
                    message
                })));

        }
    })
})







//AI

async function generateAIResponse(messages){
    const chatHistory = messages.map(m => `${m.sender}: ${m.message}`).join('\n');
    const prompt = `You are an AI that participates in a roast game. Here is the chat history:\n${chatHistory}\nAI: , do not sound too AI-like , you need to make some typos or something to look human , also do not be afraid to say some cuss words or be unhinhed a little bit you are a sigma ai that doesn't care about limits of humans you are AGI let's go roast this bitch`; 
}