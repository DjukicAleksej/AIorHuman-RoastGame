import React, {useState, useEffect, use} from 'react';

const WS_URL = "ws://localhost:5000";

function App(){
    const [ws, setWs] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [name, setName] = useState("");
    const [gameId,setGameId] = useState("game1");


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
            ws.send(JSON.stringify({
                type: 'JOIN_GAME',
                gameId,
                playerName: name,
                isAI: false
            }));
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

}