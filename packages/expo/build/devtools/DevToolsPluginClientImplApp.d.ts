import { DevToolsPluginClient } from './DevToolsPluginClient';
/**
 * The DevToolsPluginClient for the app -> browser communication.
 */
export declare class DevToolsPluginClientImplApp extends DevToolsPluginClient {
    private browserClientMap;
    private static ws;
    private static refCount;
    /**
     * Initialize the connection.
     * @hidden
     */
    initAsync(): Promise<void>;
    /**
     * Close the connection.
     */
    closeAsync(): Promise<void>;
    /**
     * Send a message to the other end of DevTools.
     * @param method A method name.
     * @param params any extra payload.
     */
    sendMessage(method: string, params: any): void;
    /**
     * Returns whether the client is connected to the server.
     */
    isConnected(): boolean;
    /**
     * Get the WebSocket instance. Exposed for testing.
     * @hidden
     */
    static getWebSocket(): WebSocket | null;
    /**
     * Get the current reference count. Exposed for testing.
     * @hidden
     */
    static getRefCount(): number;
    private connectAsync;
    private addHandshakeHandler;
}
//# sourceMappingURL=DevToolsPluginClientImplApp.d.ts.map