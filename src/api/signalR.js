import { HubConnectionBuilder } from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = new HubConnectionBuilder()
      .withUrl("http://localhost:17880/chatHub") 
      .build();
  }

  startConnection() {
    return this.connection.start();
  }

}

const signalRService = new SignalRService();

export default signalRService;