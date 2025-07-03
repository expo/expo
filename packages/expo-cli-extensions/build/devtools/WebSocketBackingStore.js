"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketBackingStore = void 0;
/**
 * The backing store for the WebSocket connection and reference count.
 * This is used for connection multiplexing.
 */
class WebSocketBackingStore {
    ws;
    refCount;
    constructor(ws = null, refCount = 0) {
        this.ws = ws;
        this.refCount = refCount;
    }
}
exports.WebSocketBackingStore = WebSocketBackingStore;
//# sourceMappingURL=WebSocketBackingStore.js.map