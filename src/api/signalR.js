import { HubConnectionBuilder } from '@microsoft/signalr';

const signalRService = {
  connection: null,

  startConnection: () => {
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5149/chatHub', {withCredentials: true})
      .build();

    signalRService.connection = connection;
    return connection.start();
  },
  invoke: (methodName, ...args) => {
    if (signalRService.connection) {
      return signalRService.connection.invoke(methodName, ...args);
    } else {
      return Promise.reject('SignalR connection is not initialized');
    }
  },
};

export default signalRService;