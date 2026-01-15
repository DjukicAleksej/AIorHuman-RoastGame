import React, {useState, useEffect} from 'react';
import "./App.css";

const WS_URL = "ws://localhost:5000";

export default function App(){
    const [ws, setWs] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [name, setName] = useState("");
    const [gameId, setGameId] = useState(null);

    const [phase, setPhase] = useState("LOBBY"); // LOBBY, IN_GAME, GAME_OVER
    const [result,setResult] = useState(null); //WIN OR LOSE

    useEffect(() => {
        const socket = new WebSocket(WS_URL);
        socket.onopen = () => console.log("Connected to WS");
        socket.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if(data.type === "GAME_START"){
                setGameId(data.gameId);
                setMessages([]);
                setPhase("CHAT");
            }

            if(data.type === "NEW_MESSAGE"){
                setMessages((prev) => [...prev,data]);
            }
            if(data.type === "GUESS_PHASE"){
                setPhase("GUESS");
            }
            if(data.type === "GUESS_RESULT"){
                setResult(data);
                setPhase("RESULT");
            }            
        };
        setWs(socket);
    }, []);
    const startGame = () => {
        ws.send(JSON.stringify({type: "START_GAME"}));
    };

    const sendMessage = () => {
        if(!input) return;
        ws.send(JSON.stringify({
            type: "SEND_MESSAGE",
            gameId,
            sender: name,
            message: input,
        }));
        setInput("");
    };

    const submitGuess = (guess) => {
        ws.send(JSON.stringify({
            type: "SUBMIT_GUESS",
            gameId,
            guess,
        }));

    };

    return (
        <div className="app">
            <h1 className="title">🤡 AI or Human?</h1>
            {phase === "LOBBY" && (
                <div className="card">
                    <input
                        placeholder="Your name"
                        value={name}
                        onChange={(e)=> setName(e.target.value)} />
                        <button onClick={startGame}>Start Game</button>
                        </div>
            )}


            {phase === "CHAT" && (
            <div className="card">
                <div className="chat">
                    {messages.map((m,i)=> (
                        <div
                        key={i}
                        className={`msg ${m.sender === "AI" ? "ai" : "human"}`}
                        >
                            <b>{m.sender}:</b> {m.message}
                        </div>
                    ))}
            </div>
                    <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Drop your roast..."
                    />
                    <button onClick={sendMessage}>Send</button>
                    </div>
            )}

            {phase === "GUESS" && (
                <div className="card">
                    <h2>Who was it?</h2>
                    <div className="guess-buttons">
                        <button onClick={() => submitGuess("ai")}>🤖 AI</button>
                        <button onClick={() => submitGuess("human")}>🧍 Human</button>
                    </div>
                    </div>
            )}
        </div>
    )

    
}