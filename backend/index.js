const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

require('dotenv').config();
const crypto = require("crypto");
const express = require('express');
const { WebSocketServer } = require('ws');


const GUESS_TIME = 30_000; // time until the player has to quess
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
let waitingPlayer = null;

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (data) => {
    const msg = JSON.parse(data);

    switch (msg.type) {
      case 'JOIN_GAME':
        const { gameId, playerName, isAI } = msg;
        if (!games[gameId]) games[gameId] = { players: [], messages: [], hasAI: true };
        games[gameId].players.push({ ws, name: playerName, isAI });
        ws.send(JSON.stringify({ type: 'JOINED', gameId }));
      break;

      case "START_GAME": {
        if(waitingPlayer){
          const gameId = crypto.randomUUID();

          games[gameId] = {
            players: [
              {ws: waitingPlayer.ws, type: 'human', id: crypto.randomUUID()},
              {ws, type: 'human', id: crypto.randomUUID()}
            ],
            hasAI: false,
            messages: [],
            phase: "CHAT",
            guessDeadline: Date.now() + GUESS_TIME,
            quesses: {}
          };
          setTimeout(() => {
            const game = games[gameId];
            if(!game) return;
            game.phase = "GUESS";
            game.players.forEach(p => 
              p.ws.send(JSON.stringify({
                type: "GUESS_PHASE"
              }))
            );
          }, GUESS_TIME);
          waitingPlayer.ws.send(JSON.stringify({
            type: "GAME_START",
            gameId,
            guessTime: 30
          }));

          ws.send(JSON.stringify({
            type: "GAME_START",
            gameId,
            guessTime: 30
          }));

          waitingPlayer = null;
        }
        else {
          waitingPlayer = { ws};
          ws.send(JSON.stringify({
            type: "STATUS",
            text: "Finding opponent..."
          }));


          setTimeout(() => {
            if(waitingPlayer?.ws === ws) {
              const gameId = crypto.randomUUID();
              games[gameId] = {
                players: [{ws,type: 'human'}],
                hasAI: true,
                messages: [],
                phase: "CHAT",
                guessDeadline: Date.now() + GUESS_TIME,
                quesses: {}
              };
              setTimeout(() => {
                const game = games[gameId];
                if (!game) return;
                game.phase = "GUESS";
                game.players.forEach(p => 
                  p.ws.send(JSON.stringify({
                    type: "GUESS_PHASE"
                  }))
                );
              }, GUESS_TIME);
              ws.send(JSON.stringify({
                type: "GAME_START",
                gameId
              }));
              waitingPlayer = null;
            }
          }, 5000);
        }
        break;
      }
      case 'SEND_MESSAGE': {
        if(game.phase !== "CHAT"){
          ws.send(JSON.stringify({
            type: "ERROR",
            message : "Chat phase is over"
          }));
          return;
        }
  const { gameId: gId, message, sender } = msg;
  const game = games[gId];
  if (!game) return;

  // save human message
  game.messages.push({ sender, message });

  // broadcast human message
  game.players.forEach(p =>
    p.ws.send(JSON.stringify({
      type: 'NEW_MESSAGE',
      sender,
      message
    }))
  );

  // AI response
  if (game.hasAI) {
    try {
      const aiMsg = await generateAIResponse(game.messages);

      game.messages.push({ sender: 'AI', message: aiMsg });

      game.players.forEach(p =>
        p.ws.send(JSON.stringify({
          type: 'NEW_MESSAGE',
          sender: 'AI',
          message: aiMsg
        }))
      );
    } catch (err) {
      console.error('AI ERROR:', err);
    }
  }

  break;
}

      default:
        console.log('Unknown message type:', msg.type);
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});







//AI

async function generateAIResponse(messages){
    const formattedMessages = messages.map(m => ({role: m.sender === 'AI' ? 'assistant' : 'user', content: m.message}));
     const response = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HC_AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'x-ai/grok-4.1-fast',
      stream: false,
      temperature: 0.9,
      max_tokens: 100,
      messages: [
        {
          role: 'system',
          content: `
                You are playing a roast game.
                Rules:
                - 2-3 sentences max
                - Be witty, slightly aggressive but playful
                - Occasionally make small typos or slang
                - Do NOT sound like an AI
                -Be unhinged roast like a real human would make it playful don't be afraid to cuss make it as realistic to human as possible
`
        },
        ...formattedMessages
      ]
    })
  });
  const raw = await response.text();
  console.log('AI RAW RESPONSE:', raw);
  if(!response.ok){
    throw new Error(`AI HTTP ${response.status}: ${raw}`);
  }
  let data;
  try{
    data = JSON.parse(raw);
  }catch{
    throw new Error(`AI INVALID JSON: ${raw}`);
  }
  if(!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content){
    throw new Error(`AI MISSING CONTENT: ${raw}`);
  }
  return data.choices[0].message.content;
}