import React, {useState, useEffect} from 'react';

const WS_URL = "ws://localhost:5000";

function App(){
    const [ws, setWs] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [name, setName] = useState("");
    const [gameId,setGameId] = useState("game1");
    const [joined, setJoined] = useState(false);


    useEffect(() => {
        const socket = new WebSocket(WS_URL);
        socket.onopen = () => console.log("Connected to WS");
            socket.onmessage = (msg) => {
                const data = JSON.parse(msg.data);
                if(data.type === "NEW_MESSAGE"){
                    setMessages(prev => [...prev, {sender: data.sender, message: data.message}]);
                }
            };
            setWs(socket);
    }, []);
    const joinGame = () => {
        if(joined) return;
            ws.send(JSON.stringify({
                type: 'JOIN_GAME',
                gameId,
                playerName: name,
            }));
        setJoined(true);
    }

    const sendMessage = () => {
        if(!input) return;
        ws.send(JSON.stringify({
            type: "SEND_MESSAGE",
            gameId,
            message: input,
            sender: name
        }));
        setInput("");
    };
return (
    <div style={{padding: "2rem"}}>
    <h1>Roast Game</h1>
    <button onClick={() => {
        ws.send(JSON.stringify({type: "START_GAME"}));
    }}>
        Start Game
    </button>
    <div>
        <input placeholder='Your Name' value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={joinGame} disabled={joined}>{joined ? "Joined" : "Join Game"}</button>
    </div>
    <div style={{border: "1px solid black", padding: "1rem", marginTop: "1rem", height: "300px", overflowY: "scroll"}}>
        {messages.map((m,i) =>(
            <div key={i}><b>{m.sender}:</b> {m.message}</div>
        ))}
    </div>

    <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
    placeholder="Write your roast..."
    />
    <button onClick={sendMessage}>Send</button>

    </div>
);
}

export default App;