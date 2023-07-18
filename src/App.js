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

  const handleCall = async (e) => {
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnection.onicecandidate = handleIceCandidate;
    peerConnection.ontrack = handleTrack;

    // Add local media tracks to the connection, e.g., using getUserMedia

    signalRService.connection2.on("ReceiveAnswer", (connectionId, sdpAnswer) => {
      if(sdpAnswer){
        const remoteDesc = new RTCSessionDescription(sdpAnswer);
        peerConnection.setRemoteDescription(remoteDesc);
      } 

      const offer = peerConnection.createOffer();
      peerConnection.setLocalDescription(offer);
      signalRService.connection2.invoke("Offer", connectionId, offer);
    });
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
    signalRService.startConnection1().then((response) => {console.log("Connection Created!"); setConnectionId(signalRService.connection1.connectionId)}).catch((error) => console.log(error));
    signalRService.connection1.on("ReceiveMessage", (user, message, date) => {
      setMessages((prevMessages) => {
        const messageExists = prevMessages.find(m => m.user === user && m.message === message && m.date === date);
        if (!messageExists) {
          return [...prevMessages, { user, message, date }];
        }
        return prevMessages;
    });
    });
  
    return () => {
      signalRService.connection1.off("LeaveUser");
    };
  }, []);

  useEffect(() => {
    const peerConnection = new RTCPeerConnection(configuration);

    signalRService.connection2.on("ReceiveOffer", (connectionId, sdpOffer) => {
      if(sdpOffer){
        peerConnection.setRemoteDescription(new RTCSessionDescription(sdpOffer));
        const answer = peerConnection.createAnswer();
        peerConnection.setLocalDescription(answer);
        signalRService.connection2.invoke("Answer", connectionId, answer)
      }
    })
    return () => {
      signalRService.connection2.removeEventListener('Left the Chat');
    };
  }, []);

  useEffect(() => {
    const constraints = {
      video: true,
      audio: true
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        console.log('Got MediaStream:', stream);
        const videoElement = document.querySelector('video#localVideo');
        videoElement.srcObject = stream;
      })
      .catch(error => {
        console.error('Error accessing media devices.', error);
      });
  }, []);

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
        <span>{message.date}</span>
      </div>
    ))}
    <form>
      <label for={"connectionId"}>Connection ID?</label>
      <input name="connectionId" onChange={(handleConnectionId)}></input>
      <button type="button" onClick={handleCall}>Call</button>
    </form>
    <h1>My Connection ID: {connectionId}</h1>
    <video id="localVideo" playsInline autoPlay></video>
    </div>
  );
}

export default App;
