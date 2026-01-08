import { DevToolsPluginClient } from './DevToolsPluginClient.js';
/**
 * The DevToolsPluginClient for the browser -> app communication.
 */
export declare class DevToolsPluginClientImplBrowser extends DevToolsPluginClient {
    private browserClientId;
    /**
     * Initialize the connection.
     * @hidden
     */
    initAsync(): Promise<void>;
    private startHandshake;
}
//# sourceMappingURL=DevToolsPluginClientImplBrowser.d.ts.map