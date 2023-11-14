import { DevToolsPluginClient, DevToolsPluginMethod, MESSAGE_PROTOCOL_VERSION, } from './DevToolsPluginClient';
import * as logger from './logger';
/**
 * The DevToolsPluginClient for the browser -> app communication.
 */
export class DevToolsPluginClientImplBrowser extends DevToolsPluginClient {
    ws = null;
    browserClientId = Date.now().toString();
    /**
     * Initialize the connection.
     * @hidden
     */
    async initAsync() {
        if (this.ws == null) {
            const ws = await this.connectAsync();
            this.ws = ws;
        }
        this.ws.addEventListener('message', this.handleMessage);
        this.startHandshake();
    }
    /**
     * Close the connection.
     */
    async closeAsync() {
        this.ws?.removeEventListener('message', this.handleMessage);
        this.ws?.close();
        this.ws = null;
        this.eventEmitter.removeAllListeners();
    }
    /**
     * Send a message to the other end of DevTools.
     * @param method A method name.
     * @param params any extra payload.
     */
    sendMessage(method, params, pluginNamespace) {
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
        this.ws?.send(JSON.stringify(payload));
    }
    /**
     * Returns whether the client is connected to the server.
     */
    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    startHandshake() {
        this.addMessageListener('terminateBrowserClient', (params) => {
            if (this.browserClientId !== params.browserClientId) {
                return;
            }
            logger.info('Received terminateBrowserClient messages and terminate the current connection');
            this.closeAsync();
        });
        this.sendMessage('handshake', {
            browserClientId: this.browserClientId,
            pluginName: this.connectionInfo.pluginName,
        });
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
                this.ws = null;
            });
        });
    }
}
//# sourceMappingURL=DevToolsPluginClientImplBrowser.js.map