import React, {useState, useEffect} from 'react'
import socketIOClient from "socket.io-client";

export default function CronTaskProgress() {
    const [response, setResponse] = useState("");

    useEffect(() => {
        const socket = socketIOClient('http://localhost:3000');
        socket.on("FromAPI", data => {
          console.log('Socket data: ',data)
          setResponse(data);
        });
        return () => socket.disconnect();
      }, []);
    return (
        <div>
          <h2>{response}</h2>  
        </div>
    )
}
