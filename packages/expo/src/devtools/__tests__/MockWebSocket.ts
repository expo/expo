interface EventSubscription {
  listener: (payload: any) => void;
  remove(): void;
}

class EventEmitter {
  listeners: Record<string, undefined | Set<(payload: any) => void>> = Object.create(null);

  addListener(event: string, listener: (payload: any) => void) {
    (this.listeners[event] || (this.listeners[event] = new Set())).add(listener);
    return {
      listener,
      remove: () => this.listeners[event]?.delete(listener),
    };
  }

  emit(event: string, payload?: any) {
    const listeners = this.listeners[event];
    if (listeners) {
      for (const listener of listeners) listener(payload);
    }
  }
}

export default class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;

  private readonly emitter = new EventEmitter();
  private subscriptions: EventSubscription[] = [];
  private broadcastSubscriptions: EventSubscription[] = [];

  // We use the broadcastEmitter to simulate event passing on a WebSocket server.
  // The map is {address -> EventEmitter}
  private static broadcastEmitter: Record<string, EventEmitter> = {};

  constructor(private readonly address: string) {
    MockWebSocket.broadcastEmitter[address] ??= new EventEmitter();
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.emitter.emit('open');

      const subscription = MockWebSocket.broadcastEmitter[this.address].addListener(
        'broadcast',
        this.handleBroadcast
      );
      this.broadcastSubscriptions.push(subscription);
    }, 0);
  }

  addEventListener = jest.fn().mockImplementation((event, listener) => {
    const subscription = this.emitter.addListener(event, listener);
    this.subscriptions.push(subscription);

    const broadcastSubscription = MockWebSocket.broadcastEmitter[this.address].addListener(
      event,
      listener
    );
    this.broadcastSubscriptions.push(broadcastSubscription);
  });
  removeEventListener = jest.fn().mockImplementation((event, listener) => {
    const index = this.subscriptions.findIndex(
      (subscription) => subscription.listener === listener
    );
    if (index >= 0) {
      this.subscriptions[index].remove();
      this.subscriptions.splice(index, 1);
    }

    const broadcastIndex = this.broadcastSubscriptions.findIndex(
      (subscription) => subscription.listener === listener
    );
    if (broadcastIndex >= 0) {
      this.broadcastSubscriptions[broadcastIndex].remove();
      this.broadcastSubscriptions.splice(broadcastIndex, 1);
    }
  });

  close = jest.fn().mockImplementation(() => {
    for (const subscription of this.broadcastSubscriptions) {
      subscription.remove();
    }
    this.broadcastSubscriptions = [];
    this.readyState = MockWebSocket.CLOSED;
  });

  send = jest.fn().mockImplementation((data) => {
    MockWebSocket.broadcastEmitter[this.address].emit('broadcast', { sender: this, data });
  });

  private handleBroadcast = ({ sender, data }: any) => {
    if (sender !== this) {
      this.emitter.emit('message', { data });
    }
  };
}
