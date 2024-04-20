import type { WebSocketBackingStore } from './WebSocketBackingStore';
/**
 * The connection info for devtools plugins client.
 */
export interface ConnectionInfo {
    /** Indicates the sender towards the devtools plugin. */
    sender: 'app' | 'browser';
    /** Dev server address. */
    devServer: string;
    /** The plugin name. */
    pluginName: string;
    /**
     * The backing store for the WebSocket connection. Exposed for testing.
     * If not provided, the default singleton instance will be used.
     * @hidden
     */
    wsStore?: WebSocketBackingStore;
}
/**
 * Parameters for the `handshake` message.
 * @hidden
 */
export interface HandshakeMessageParams {
    browserClientId: string;
    pluginName: string;
}
//# sourceMappingURL=devtools.types.d.ts.map