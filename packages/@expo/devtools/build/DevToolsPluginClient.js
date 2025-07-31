import { MessageFramePacker } from './MessageFramePacker';
import { WebSocketBackingStore } from './WebSocketBackingStore';
import { WebSocketWithReconnect, } from './WebSocketWithReconnect';
import * as logger from './logger';
import { blobToArrayBufferAsync } from './utils/blobUtils';
/**
 * This client is for the Expo DevTools Plugins to communicate between the app and the DevTools webpage hosted in a browser.
 * All the code should be both compatible with browsers and React Native.
 */
export class DevToolsPluginClient {
    connectionInfo;
    options;
    listeners;
    static defaultWSStore = new WebSocketBackingStore();
    wsStore = DevToolsPluginClient.defaultWSStore;
    isClosed = false;
    retries = 0;
    messageFramePacker = new MessageFramePacker();
    constructor(connectionInfo, options) {
        this.connectionInfo = connectionInfo;
        this.options = options;
        this.wsStore = connectionInfo.wsStore || DevToolsPluginClient.defaultWSStore;
        this.listeners = Object.create(null);
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
        this.listeners = Object.create(null);
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
        const messageKey = {
            pluginName: this.connectionInfo.pluginName,
            method,
        };
        const packedData = this.messageFramePacker.pack({ messageKey, payload: params });
        if (!(packedData instanceof Promise)) {
            this.wsStore.ws?.send(packedData);
            return;
        }
        packedData.then((data) => {
            this.wsStore.ws?.send(data);
        });
    }
    /**
     * Subscribe to a message from the other end of DevTools.
     * @param method Subscribe to a message with a method name.
     * @param listener Listener to be called when a message is received.
     */
    addMessageListener(method, listener) {
        const listenersForMethod = this.listeners[method] || (this.listeners[method] = new Set());
        listenersForMethod.add(listener);
        return {
            remove: () => {
                this.listeners[method]?.delete(listener);
            },
        };
    }
    /**
     * Subscribe to a message from the other end of DevTools just once.
     * @param method Subscribe to a message with a method name.
     * @param listener Listener to be called when a message is received.
     */
    addMessageListenerOnce(method, listener) {
        const wrappedListenerOnce = (params) => {
            listener(params);
            this.listeners[method]?.delete(wrappedListenerOnce);
        };
        this.addMessageListener(method, wrappedListenerOnce);
    }
    /**
     * Internal handshake message sender.
     * @hidden
     */
    sendHandshakeMessage(params) {
        if (this.wsStore.ws?.readyState === WebSocket.CLOSED) {
            logger.warn('Unable to send message in a disconnected state.');
            return;
        }
        this.wsStore.ws?.send(JSON.stringify({ ...params, __isHandshakeMessages: true }));
    }
    /**
     * Internal handshake message listener.
     * @hidden
     */
    addHandskakeMessageListener(listener) {
        const messageListener = (event) => {
            if (typeof event.data !== 'string') {
                // binary data is not coming from the handshake messages.
                return;
            }
            const data = JSON.parse(event.data);
            if (!data.__isHandshakeMessages) {
                return;
            }
            delete data.__isHandshakeMessages;
            const params = data;
            if (params.pluginName && params.pluginName !== this.connectionInfo.pluginName) {
                return;
            }
            listener(params);
        };
        this.wsStore.ws?.addEventListener('message', messageListener);
        return {
            remove: () => {
                this.wsStore.ws?.removeEventListener('message', messageListener);
            },
        };
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
            const endpoint = 'expo-dev-plugins/broadcast';
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
    handleMessage = async (event) => {
        let data;
        if (typeof event.data === 'string') {
            data = event.data;
        }
        else if (event.data instanceof ArrayBuffer) {
            data = event.data;
        }
        else if (ArrayBuffer.isView(event.data)) {
            data = event.data.buffer;
        }
        else if (event.data instanceof Blob) {
            data = await blobToArrayBufferAsync(event.data);
        }
        else {
            logger.warn('Unsupported received data type in handleMessageImpl');
            return;
        }
        const { messageKey, payload, ...rest } = this.messageFramePacker.unpack(data);
        // @ts-expect-error: `__isHandshakeMessages` is a private field that is not part of the MessageFramePacker type.
        if (rest?.__isHandshakeMessages === true) {
            return;
        }
        if (messageKey.pluginName && messageKey.pluginName !== this.connectionInfo.pluginName) {
            return;
        }
        const listenersForMethod = this.listeners[messageKey.method];
        if (listenersForMethod) {
            for (const listener of listenersForMethod) {
                listener(payload);
            }
        }
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