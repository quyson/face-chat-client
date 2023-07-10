import { HubConnectionBuilder } from '@microsoft/signalr';

const signalRService = {
  connection: null,

  startConnection: () => {
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5149/chatHub') // Replace with your SignalR endpoint
      .build();

    signalRService.connection = connection;

    return connection.start();
  },
};

export default signalRService;