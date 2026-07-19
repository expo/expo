import { Task } from './Task';

export enum MessageType {
  INFO,
  WARNING,
}

export class Print extends Task {
  private readonly messageType: MessageType;
  private readonly message: string;

  constructor(messageType: MessageType, message: string) {
    super();
    this.messageType = messageType;
    this.message = message;
  }

  protected execute(): Promise<void> {
    this.getLogFunction()(this.message);
    return Promise.resolve();
  }

  private getLogFunction(): (message: string) => void {
    switch (this.messageType) {
      case MessageType.INFO:
        return console.log;
      case MessageType.WARNING:
        return console.warn;
      default:
        return console.log;
    }
  }
}
