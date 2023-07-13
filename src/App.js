import {useState, useEffect} from "react";
import signalRService from "./api/signalR";

function App() {

  const [message, setMessage] = useState(null);
  const [username, setUsername] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connectionId, setConnectionId] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);


  const handleMessage = (e) => {
    setMessage(e.target.value);
  }

  const handleUsername = (e) => {
    setUsername(e.target.value);
  }

  const handleNewMessage = (user, message) => {
    setMessages((prevMessages) => [...prevMessages, { user, message }]);
  };

  const handleConnectionId = (e) => {
    setConnectionId(e.target.value);
  }

  const handleIceCandidate = (e) => {
    const candidate = e.candidate;
    if (candidate) {
      signalRService.connection2.sendIceCandidate(connectionId, candidate);
    }
  };

  const handleTrack = (e) => {
    const track = e.rack;
    const stream = remoteStream || new MediaStream();
    stream.addTrack(track);
    setRemoteStream(stream);
  };

  const sendMessage = () => {
    if(!username || !message){
      console.log("No Username or Message!")
      return;
    }
    signalRService.connection1.invoke('SendMessage', username, message)
      .then(() => {
        console.log('Message sent successfully');
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  }

  useEffect(() => {
    signalRService.startConnection1().then((response) => console.log("Connection Created!")).catch((error) => console.log(error));
    signalRService.connection1.on("ReceiveMessage", (user, message) => {
      setMessages((prevMessages) => [...prevMessages, { user, message }]);
    });
  
    return () => {
      signalRService.connection1.off("LeaveUser");
    };
  }, []);

  /*useEffect(() => {
    signalRService.connection.on("ReceiveMessage", handleNewMessage);

    return () => {
      signalRService.connection.off("ReceiveMessage", handleNewMessage);
    };
  }, []);*/

  return (
    <div>
      <form>
        <label for={"username"}>Username</label>
        <input type="text" onChange={handleUsername} name="username"></input>
        <input type="text" onChange={handleMessage} placeholder="Send Message"></input>
        <button type="button" onClick={sendMessage}>Send</button>
      </form>
      <h1>Messages:</h1>
      {messages && messages.map((message, index) => (
      <div key={index}>
        <span>{message.user}: </span>
        <span>{message.message}</span>
      </div>
    ))}
    <form>
      <label for={"connectionId"}>Connection ID?</label>
      <input name="connectionId" onChange={(handleConnectionId)}></input>
      <button type="button" onClick={sendCall}>Call</button>
    </form>
    </div>
  );
}

export default App;
