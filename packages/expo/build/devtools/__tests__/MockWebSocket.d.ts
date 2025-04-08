export default class MockWebSocket {
    private readonly address;
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    readyState: number;
    private readonly emitter;
    private subscriptions;
    private broadcastSubscriptions;
    private static broadcastEmitter;
    constructor(address: string);
    addEventListener: jest.Mock<any, any, any>;
    removeEventListener: jest.Mock<any, any, any>;
    close: jest.Mock<any, any, any>;
    send: jest.Mock<any, any, any>;
    private handleBroadcast;
}
//# sourceMappingURL=MockWebSocket.d.ts.map