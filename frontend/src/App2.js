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
}