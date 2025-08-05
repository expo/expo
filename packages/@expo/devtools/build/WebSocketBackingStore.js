/**
 * The backing store for the WebSocket connection and reference count.
 * This is used for connection multiplexing.
 */
export class WebSocketBackingStore {
    ws;
    refCount;
    constructor(ws = null, refCount = 0) {
        this.ws = ws;
        this.refCount = refCount;
    }
}
//# sourceMappingURL=WebSocketBackingStore.js.map