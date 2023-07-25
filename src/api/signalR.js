import { HubConnectionBuilder } from '@microsoft/signalr';

const signalRService = {
  connection1: null,
  connection2: null,

  startConnection1: () => {
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5149/chatHub', {withCredentials: true})
      .build();

    signalRService.connection1 = connection;
    return connection.start();
  },
  startConnection2: () => {
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5149/webRTC', {withCredentials: true})
      .build();

    signalRService.connection2 = connection;
    return connection.start();
  },
  /*invoke: (connectionName, methodName, ...args) => {
    const connection = signalRService[connectionName];
    if (connection) {
      return connection.invoke(methodName, ...args);
    } else {
      return Promise.reject('SignalR connection is not initialized');
    }
  },*/
  sendOffer: (connectionId, sdpOffer, username) => {
    signalRService.connection2.invoke('Offer', connectionId, sdpOffer, username)
        .catch(error => console.error('Error sending offer:', error));
  },

  sendAnswer: (connectionId, sdpAnswer, username) => {
    signalRService.connection2.invoke('ReceiveAnswer', connectionId, sdpAnswer, username)
        .catch(error => console.error('Error sending answer:', error));
  },

  sendIceCandidate: (connectionId, candidate) => {
    signalRService.connection2.invoke('SendIceCandidate', connectionId, candidate)
        .catch(error => console.error('Error sending ICE candidate:', error));
  }
};

export default signalRService;