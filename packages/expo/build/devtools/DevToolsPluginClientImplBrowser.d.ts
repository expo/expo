import { DevToolsPluginClient } from './DevToolsPluginClient';
/**
 * The DevToolsPluginClient for the browser -> app communication.
 */
export declare class DevToolsPluginClientImplBrowser extends DevToolsPluginClient {
    private ws;
    private browserClientId;
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
    sendMessage(method: string, params: any, pluginNamespace?: string): void;
    /**
     * Returns whether the client is connected to the server.
     */
    isConnected(): boolean;
    private startHandshake;
    private connectAsync;
}
//# sourceMappingURL=DevToolsPluginClientImplBrowser.d.ts.map