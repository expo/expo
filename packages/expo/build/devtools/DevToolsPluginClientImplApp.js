import { DevToolsPluginClient } from './DevToolsPluginClient';
import * as logger from './logger';
/**
 * The DevToolsPluginClient for the app -> browser communication.
 */
export class DevToolsPluginClientImplApp extends DevToolsPluginClient {
    // Map of pluginName -> browserClientId
    browserClientMap = {};
    /**
     * Initialize the connection.
     * @hidden
     */
    async initAsync() {
        await super.initAsync();
        this.addHandshakeHandler();
    }
    addHandshakeHandler() {
        this.addMessageListener('handshake', (params) => {
            const previousBrowserClientId = this.browserClientMap[params.pluginName];
            if (previousBrowserClientId != null && previousBrowserClientId !== params.browserClientId) {
                logger.info(`Terminate the previous browser client connection - previousBrowserClientId[${previousBrowserClientId}]`);
                this.sendMessage('terminateBrowserClient', { browserClientId: previousBrowserClientId });
            }
            this.browserClientMap[params.pluginName] = params.browserClientId;
        });
    }
}
//# sourceMappingURL=DevToolsPluginClientImplApp.js.map