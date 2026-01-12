const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

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

    switch (msg.type) {
      case 'JOIN_GAME':
        const { gameId, playerName, isAI } = msg;
        if (!games[gameId]) games[gameId] = { players: [], messages: [], hasAI: true };
        games[gameId].players.push({ ws, name: playerName, isAI });
        ws.send(JSON.stringify({ type: 'JOINED', gameId }));
        break;

      case 'SEND_MESSAGE': {
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
      model: 'qwen/qwen3-32b',
      stream: false,
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
      ],
      temperature: 0.9
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}