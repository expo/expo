import { DevToolsPluginClient } from './DevToolsPluginClient';
/**
 * The DevToolsPluginClient for the app -> browser communication.
 */
export declare class DevToolsPluginClientImplApp extends DevToolsPluginClient {
    private browserClientMap;
    /**
     * Initialize the connection.
     * @hidden
     */
    initAsync(): Promise<void>;
    private addHandshakeHandler;
}
//# sourceMappingURL=DevToolsPluginClientImplApp.d.ts.map