import { EventEmitter } from 'fbemitter';
import { MessageFramePacker } from './MessageFramePacker';
import { WebSocketBackingStore } from './WebSocketBackingStore';
import { WebSocketWithReconnect } from './WebSocketWithReconnect';
import { blobToArrayBufferAsync } from './blobUtils';
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
    options;
    eventEmitter = new EventEmitter();
    static defaultWSStore = new WebSocketBackingStore();
    wsStore = DevToolsPluginClient.defaultWSStore;
    isClosed = false;
    retries = 0;
    useTransportationNext;
    messageFramePacker;
    constructor(connectionInfo, options) {
        this.connectionInfo = connectionInfo;
        this.options = options;
        this.wsStore = connectionInfo.wsStore || DevToolsPluginClient.defaultWSStore;
        this.useTransportationNext = options?.useTransportationNext ?? false;
        this.messageFramePacker = this.useTransportationNext ? new MessageFramePacker() : null;
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
        if (this.useTransportationNext) {
            this.sendMessageImplTransportationNext(method, params);
        }
        else {
            this.sendMessageImplLegacy(method, params);
        }
    }
    sendMessageImplLegacy(method, params) {
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
    async sendMessageImplTransportationNext(method, params) {
        if (this.messageFramePacker == null) {
            logger.warn('MessageFramePacker is not initialized');
            return;
        }
        const messageKey = {
            pluginName: this.connectionInfo.pluginName,
            method,
        };
        const packedData = await this.messageFramePacker.pack({ messageKey, payload: params });
        this.wsStore.ws?.send(packedData);
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
            const endpoint = this.useTransportationNext ? 'expo-dev-plugins/broadcast' : 'message';
            const ws = new WebSocketWithReconnect(`ws://${this.connectionInfo.devServer}/${endpoint}`, {
                binaryType: this.options?.websocketBinaryType,
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
        if (this.useTransportationNext) {
            this.handleMessageImplTransportationNext(event);
        }
        else {
            this.handleMessageImplLegacy(event);
        }
    };
    handleMessageImplLegacy = (event) => {
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
    handleMessageImplTransportationNext = async (event) => {
        if (this.messageFramePacker == null) {
            logger.warn('MessageFramePacker is not initialized');
            return;
        }
        let buffer;
        if (event.data instanceof ArrayBuffer) {
            buffer = event.data;
        }
        else if (event.data instanceof Blob) {
            buffer = await blobToArrayBufferAsync(event.data);
        }
        else {
            logger.warn('Unsupported received data type in handleMessageImplTransportationNext');
            return;
        }
        const { messageKey, payload } = await this.messageFramePacker.unpack(buffer);
        if (messageKey.pluginName && messageKey.pluginName !== this.connectionInfo.pluginName) {
            return;
        }
        this.eventEmitter.emit(messageKey.method, payload);
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