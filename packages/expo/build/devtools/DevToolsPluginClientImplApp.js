import { DevToolsPluginClient, DevToolsPluginMethod, MESSAGE_PROTOCOL_VERSION, } from './DevToolsPluginClient';
import * as logger from './logger';
/**
 * The DevToolsPluginClient for the app -> browser communication.
 */
export class DevToolsPluginClientImplApp extends DevToolsPluginClient {
    // Map of pluginName -> browserClientId
    browserClientMap = {};
    static ws = null;
    static refCount = 0;
    /**
     * Initialize the connection.
     * @hidden
     */
    async initAsync() {
        if (DevToolsPluginClientImplApp.ws == null) {
            DevToolsPluginClientImplApp.ws = await this.connectAsync();
        }
        DevToolsPluginClientImplApp.refCount += 1;
        DevToolsPluginClientImplApp.ws.addEventListener('message', this.handleMessage);
        this.addHandshakeHandler();
    }
    /**
     * Close the connection.
     */
    async closeAsync() {
        this.eventEmitter.removeAllListeners();
        DevToolsPluginClientImplApp.ws?.removeEventListener('message', this.handleMessage);
        DevToolsPluginClientImplApp.refCount -= 1;
        if (DevToolsPluginClientImplApp.refCount < 1) {
            DevToolsPluginClientImplApp.ws?.close();
            DevToolsPluginClientImplApp.ws = null;
        }
    }
    /**
     * Send a message to the other end of DevTools.
     * @param method A method name.
     * @param params any extra payload.
     */
    sendMessage(method, params) {
        if (!this.isConnected()) {
            throw new Error('Unable to send message in a disconnected state.');
        }
        const payload = {
            version: MESSAGE_PROTOCOL_VERSION,
            pluginName: this.connectionInfo.pluginName,
            method: DevToolsPluginMethod,
            params: {
                method,
                params,
            },
        };
        DevToolsPluginClientImplApp.ws?.send(JSON.stringify(payload));
    }
    /**
     * Returns whether the client is connected to the server.
     */
    isConnected() {
        return DevToolsPluginClientImplApp.ws?.readyState === WebSocket.OPEN;
    }
    /**
     * Get the WebSocket instance. Exposed for testing.
     * @hidden
     */
    static getWebSocket() {
        return DevToolsPluginClientImplApp.ws;
    }
    /**
     * Get the current reference count. Exposed for testing.
     * @hidden
     */
    static getRefCount() {
        return DevToolsPluginClientImplApp.refCount;
    }
    async connectAsync() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://${this.connectionInfo.devServer}/message`);
            ws.addEventListener('open', () => {
                resolve(ws);
            });
            ws.addEventListener('error', (e) => {
                reject(e);
            });
            ws.addEventListener('close', (e) => {
                logger.info('WebSocket closed', e.code, e.reason);
                DevToolsPluginClientImplApp.ws = null;
            });
        });
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