/**
 * The backing store for the WebSocket connection and reference count.
 * This is used for connection multiplexing.
 */
export declare class WebSocketBackingStore {
    ws: WebSocket | null;
    refCount: number;
    constructor(ws?: WebSocket | null, refCount?: number);
}
//# sourceMappingURL=WebSocketBackingStore.d.ts.map