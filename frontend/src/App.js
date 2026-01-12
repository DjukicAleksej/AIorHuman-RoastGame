import React, {useState, useEffect, use} from 'react';

const WS_URL = "ws://localhost:5000";

function App(){
    const [ws, setWs] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [name, setName] = useState("");
    const [gameId,setGameId] = useState("game1");
}