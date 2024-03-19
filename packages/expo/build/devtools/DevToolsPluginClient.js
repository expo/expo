import { EventEmitter } from 'fbemitter';
import { WebSocketBackingStore } from './WebSocketBackingStore';
import { WebSocketWithReconnect } from './WebSocketWithReconnect';
import * as logger from './logger';
// This version should be synced with the one in the **createMessageSocketEndpoint.ts** in @react-native-community/cli-server-api
export const MESSAGE_PROTOCOL_VERSION = 2;
export const DevToolsPluginMethod = 'Expo:DevToolsPlugin';
/**
 * This client is for the Expo DevTools Plugins to communicate between the app and the DevTools webpage hosted in a browser.
 * All the code should be both compatible with browsers and React Native.
 */
export class DevToolsPluginClient {
    connectionInfo;
    eventEmitter = new EventEmitter();
    static defaultWSStore = new WebSocketBackingStore();
    wsStore = DevToolsPluginClient.defaultWSStore;
    isClosed = false;
    retries = 0;
    constructor(connectionInfo) {
        this.connectionInfo = connectionInfo;
        this.wsStore = connectionInfo.wsStore || DevToolsPluginClient.defaultWSStore;
    }
    /**
     * Initialize the connection.
     * @hidden
     */
    async initAsync() {
        if (this.wsStore.ws == null) {
            this.wsStore.ws = await this.connectAsync();
        }
        this.wsStore.refCount += 1;
        this.wsStore.ws.addEventListener('message', this.handleMessage);
    }
    /**
     * Close the connection.
     */
    async closeAsync() {
        this.isClosed = true;
        this.wsStore.ws?.removeEventListener('message', this.handleMessage);
        this.wsStore.refCount -= 1;
        if (this.wsStore.refCount < 1) {
            this.wsStore.ws?.close();
            this.wsStore.ws = null;
        }
        this.eventEmitter.removeAllListeners();
    }
    /**
     * Send a message to the other end of DevTools.
     * @param method A method name.
     * @param params any extra payload.
     */
    sendMessage(method, params) {
        if (this.wsStore.ws?.readyState === WebSocket.CLOSED) {
            logger.warn('Unable to send message in a disconnected state.');
            return;
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
        this.wsStore.ws?.send(JSON.stringify(payload));
    }
    /**
     * Subscribe to a message from the other end of DevTools.
     * @param method Subscribe to a message with a method name.
     * @param listener Listener to be called when a message is received.
     */
    addMessageListener(method, listener) {
        return this.eventEmitter.addListener(method, listener);
    }
    /**
     * Subscribe to a message from the other end of DevTools just once.
     * @param method Subscribe to a message with a method name.
     * @param listener Listener to be called when a message is received.
     */
    addMessageListenerOnce(method, listener) {
        this.eventEmitter.once(method, listener);
    }
    /**
     * Returns whether the client is connected to the server.
     */
    isConnected() {
        return this.wsStore.ws?.readyState === WebSocket.OPEN;
    }
    /**
     * The method to create the WebSocket connection.
     */
    connectAsync() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocketWithReconnect(`ws://${this.connectionInfo.devServer}/message`, {
                onError: (e) => {
                    if (e instanceof Error) {
                        console.warn(`Error happened from the WebSocket connection: ${e.message}\n${e.stack}`);
                    }
                    else {
                        console.warn(`Error happened from the WebSocket connection: ${JSON.stringify(e)}`);
                    }
                },
            });
            ws.addEventListener('open', () => {
                resolve(ws);
            });
            ws.addEventListener('error', (e) => {
                reject(e);
            });
            ws.addEventListener('close', (e) => {
                logger.info('WebSocket closed', e.code, e.reason);
            });
        });
    }
    handleMessage = (event) => {
        let payload;
        try {
            payload = JSON.parse(event.data);
        }
        catch (e) {
            logger.info('Failed to parse JSON', e);
            return;
        }
        if (payload.version !== MESSAGE_PROTOCOL_VERSION || payload.method !== DevToolsPluginMethod) {
            return;
        }
        if (payload.pluginName && payload.pluginName !== this.connectionInfo.pluginName) {
            return;
        }
        this.eventEmitter.emit(payload.params.method, payload.params.params);
    };
    /**
     * Get the WebSocket backing store. Exposed for testing.
     * @hidden
     */
    getWebSocketBackingStore() {
        return this.wsStore;
    }
}
//# sourceMappingURL=DevToolsPluginClient.js.map