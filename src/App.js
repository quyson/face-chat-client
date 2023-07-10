import {useState, useEffect} from "react";
import signalRService from "./api/signalR";

function App() {

  const [message, setMessage] = useState(null);
  const [username, setUsername] = useState(null);
  const [messages, setMessages] = useState([]);


  const handleMessage = (e) => {
    setMessage(e.target.value);
  }

  const handleUsername = (e) => {
    setUsername(e.target.value);
  }

  const handleNewMessage = (user, message) => {
    setMessages((prevMessages) => [...prevMessages, { user, message }]);
  };

  const sendMessage = () => {
    if(!username || !message){
      console.log("No Username or Message!")
      return;
    }
    signalRService.invoke('SendMessage', username, message)
      .then(() => {
        console.log('Message sent successfully');
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  }

  useEffect(() => {
    signalRService.startConnection().then((response) => console.log("Connection Created!")).catch((error) => console.log(error));
    signalRService.connection.on("ReceiveMessage", (user, message) => {
      setMessages((prevMessages) => [...prevMessages, { user, message }]);
    });
  
    return () => {
      signalRService.connection.off("LeaveUser");
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
    </div>
  );
}

export default App;
