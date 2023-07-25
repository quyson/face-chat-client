import {useState, useEffect} from "react";
import signalRService from "./api/signalR";

function App() {

  const [message, setMessage] = useState(null);
  const [username, setUsername] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [myConnectionId, setMyConnectionId] = useState(null);
  const [peerName, setPeerName] = useState(null);

  const handleMessage = (e) => {
    setMessage(e.target.value);
  }

  const handleUsername = (e) => {
    setUsername(e.target.value);
  }

  const handleUserId = (e) => {
    setUserId(e.target.value);
  }

  const handleCall = async (e) => {
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnection.onicecandidate = (e) => {
      if(e.candidate){
        try{
          signalRService.connection2.invoke("SendIceCandidate", userId, JSON.stringify(e.candidate))
        } catch (error){
          console.log(`Unable To Send Ice Candidate: ${error}`);
        }
      }
    }

    navigator.mediaDevices.getUserMedia({video: true, audio: true})
    .then((stream) => {
      const myVideo = document.querySelector("#local");
      myVideo.srcObject = stream;
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      })
    });

    const remoteVideo = document.querySelector('#remote');
    peerConnection.addEventListener('track', async (event) => {
      const [remoteStream] = event.streams;
      remoteVideo.srcObject = remoteStream;
    });

    const handleAnswer = async (connectionId, sdpAnswer, peername) => {
      try{
        if(sdpAnswer){
          await peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(sdpAnswer)));
          setPeerName(peername);
          
        } 
      }
      catch(error){
        console.log(`Unable to Secure SDPAnswer: ${error}`);
      }
    }

    signalRService.connection2.on("ReceiveAnswer", handleAnswer);

    signalRService.connection2.on('ReceiveIceCandidate', (connectionId, candidate) => {
      if (candidate) {
        try {
          peerConnection.addIceCandidate(JSON.parse(candidate));
        } catch (error) {
          console.error(`Unable to Add Ice Candidate ${error}`);
        }
      }
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
    signalRService.connection2.invoke('Offer', userId, JSON.stringify(peerConnection.localDescription), username);
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
    signalRService.startConnection1().then((response) => {console.log("Connection Created!")}).catch((error) => console.log(error));
    signalRService.startConnection2().then((response) => {console.log("Connection to WebRTC Hub Created!"); setMyConnectionId(signalRService.connection2.connectionId)}).catch((error) => console.log("Error!"));
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
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const peerConnection = new RTCPeerConnection(configuration)

    const handleReceiveOffer = async (userId, sdpOffer, peername) => {
      try{
        if (sdpOffer) {
          await peerConnection.setRemoteDescription(JSON.parse(sdpOffer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
          signalRService.connection2.invoke('Answer', userId, JSON.stringify(peerConnection.localDescription), username);
          setPeerName(peername);
          navigator.mediaDevices.getUserMedia({video: true, audio: true})
          .then((stream) => {
            const myVideo = document.querySelector("#local");
            myVideo.srcObject = stream;
            stream.getTracks().forEach((track) => {
              peerConnection.addTrack(track, stream);
            })
          });
        }
      }
      catch(error){
        console.log(error);
      }
    };

    signalRService.connection2.on('ReceiveIceCandidate', (connectionId, candidate) => {
      if (candidate) {
        try {
          peerConnection.addIceCandidate(JSON.parse(candidate));
        } catch (error) {
          console.error(`Unable to Add Ice Candidate ${error}`);
        }
      }
    });

    signalRService.connection2.on("ReceiveOffer", handleReceiveOffer);
  
    return () => {
      signalRService.connection2.off("LeaveUser");
    };
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
      <label for={"connectionId"}>User Connection ID?</label>
      <input name="connectionId" onChange={(handleUserId)}></input>
      <button type="button" onClick={handleCall}>Call</button>
    </form>
    <h1>My Connection ID: {myConnectionId}</h1>
    <div>
      <h3>Local</h3>
      <video id="local" playsInline autoPlay></video>
    </div>
    <div>
        <h3>remote</h3>
        {peerName ? <div>{peerName}</div> : null}
      <video id="remote" playsInline autoPlay></video>
    </div>
    </div>
  );
}

export default App;
