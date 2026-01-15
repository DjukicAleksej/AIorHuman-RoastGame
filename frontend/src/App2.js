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
    

}