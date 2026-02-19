/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __nccwpck_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__nccwpck_require__.r(__webpack_exports__);

// EXPORTS
__nccwpck_require__.d(__webpack_exports__, {
  DevToolsPluginClient: () => (/* reexport */ DevToolsPluginClient),
  getDevToolsPluginClientAsync: () => (/* reexport */ getDevToolsPluginClientAsync),
  queryAllInspectorAppsAsync: () => (/* reexport */ queryAllInspectorAppsAsync),
  runCliExtension: () => (/* reexport */ runCliExtension),
  sendCliMessageAsync: () => (/* reexport */ sendCliMessageAsync),
  setEnableLogging: () => (/* reexport */ setEnableLogging),
  startCliListenerAsync: () => (/* reexport */ startCliListenerAsync),
  unstable_WebSocketBackingStore: () => (/* reexport */ WebSocketBackingStore),
  unstable_createDevToolsPluginClient: () => (/* reexport */ createDevToolsPluginClient),
  unstable_getConnectionInfo: () => (/* reexport */ getConnectionInfo)
});

;// CONCATENATED MODULE: ./src/logger.ts
let enableLogging = false;
function log(...params) {
    if (enableLogging) {
        console.log(...params);
    }
}
function debug(...params) {
    if (enableLogging) {
        console.debug(...params);
    }
}
function info(...params) {
    if (enableLogging) {
        console.info(...params);
    }
}
function warn(...params) {
    if (enableLogging) {
        console.warn(...params);
    }
}
function setEnableLogging(enabled) {
    enableLogging = enabled;
}

;// CONCATENATED MODULE: ./src/utils/blobUtils.ts
/**
 * Converts a Blob to an ArrayBuffer.
 */
function blobToArrayBufferAsync(blob) {
    if (typeof blob.arrayBuffer === 'function') {
        return blob.arrayBuffer();
    }
    return legacyBlobToArrayBufferAsync(blob);
}
/**
 * Converts a Blob to an ArrayBuffer using the FileReader API.
 */
async function legacyBlobToArrayBufferAsync(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

;// CONCATENATED MODULE: ./src/MessageFramePacker.ts
/**
 * A message frame packer that serializes a messageKey and a payload into either a JSON string
 * (fast path) or a binary format (for complex payloads).
 *
 * Fast Path (JSON.stringify/JSON.parse):
 * - For simple payloads (e.g., strings, numbers, null, undefined, or plain objects), the packer
 *   uses `JSON.stringify` for serialization and `JSON.parse` for deserialization, ensuring
 *   optimal performance.
 *
 * Binary Format:
 * - For more complex payloads (e.g., Uint8Array, ArrayBuffer, Blob), the packer uses a binary
 *   format with the following structure:
 *
 *   +------------------+-------------------+----------------------------+--------------------------+
 *   | 4 bytes (Uint32) | Variable length   | 1 byte (Uint8)             | Variable length          |
 *   | MessageKeyLength | MessageKey (JSON) | PayloadTypeIndicator (enum)| Payload (binary data)    |
 *   +------------------+-------------------+----------------------------+--------------------------+
 *
 *   1. MessageKeyLength (4 bytes):
 *      - A 4-byte unsigned integer indicating the length of the MessageKey JSON string.
 *
 *   2. MessageKey (Variable length):
 *      - The JSON string representing the message key, encoded as UTF-8.
 *
 *   3. PayloadTypeIndicator (1 byte):
 *      - A single byte enum value representing the type of the payload (e.g., Uint8Array, String,
 *        Object, ArrayBuffer, Blob).
 *
 *   4. Payload (Variable length):
 *      - The actual payload data, which can vary in type and length depending on the PayloadType.
 */

var PayloadTypeIndicator;
(function (PayloadTypeIndicator) {
    PayloadTypeIndicator[PayloadTypeIndicator["Uint8Array"] = 1] = "Uint8Array";
    PayloadTypeIndicator[PayloadTypeIndicator["String"] = 2] = "String";
    PayloadTypeIndicator[PayloadTypeIndicator["Number"] = 3] = "Number";
    PayloadTypeIndicator[PayloadTypeIndicator["Null"] = 4] = "Null";
    PayloadTypeIndicator[PayloadTypeIndicator["Undefined"] = 5] = "Undefined";
    PayloadTypeIndicator[PayloadTypeIndicator["Object"] = 6] = "Object";
    PayloadTypeIndicator[PayloadTypeIndicator["ArrayBuffer"] = 7] = "ArrayBuffer";
    PayloadTypeIndicator[PayloadTypeIndicator["Blob"] = 8] = "Blob";
})(PayloadTypeIndicator || (PayloadTypeIndicator = {}));
class MessageFramePacker {
    textEncoder = new TextEncoder();
    textDecoder = new TextDecoder();
    pack({ messageKey, payload }) {
        // Fast path to pack as string given `JSON.stringify` is fast.
        if (this.isFastPathPayload(payload)) {
            return JSON.stringify({ messageKey, payload });
        }
        // Slowest path for Blob returns a promise.
        if (payload instanceof Blob) {
            return new Promise(async (resolve, reject) => {
                try {
                    const arrayBuffer = await blobToArrayBufferAsync(payload);
                    resolve(this.packImpl({ messageKey, payload: new Uint8Array(arrayBuffer) }, PayloadTypeIndicator.Blob));
                }
                catch (error) {
                    reject(error);
                }
            });
        }
        // Slow path for other types returns a Uint8Array.
        return this.packImpl({ messageKey, payload }, undefined);
    }
    unpack(packedData) {
        // Fast path to unpack as string given `JSON.parse` is fast.
        if (typeof packedData === 'string') {
            return JSON.parse(packedData);
        }
        // [0] messageKeyLength (4 bytes)
        const messageKeyLengthView = new DataView(packedData, 0, 4);
        const messageKeyLength = messageKeyLengthView.getUint32(0, false);
        // [1] messageKey (variable length)
        const messageKeyBytes = packedData.slice(4, 4 + messageKeyLength);
        const messageKeyString = this.textDecoder.decode(messageKeyBytes);
        const messageKey = JSON.parse(messageKeyString);
        // [2] payloadTypeIndicator (1 byte)
        const payloadTypeView = new DataView(packedData, 4 + messageKeyLength, 1);
        const payloadType = payloadTypeView.getUint8(0);
        // [3] payload (variable length)
        const payloadBinary = packedData.slice(4 + messageKeyLength + 1);
        const payload = this.deserializePayload(payloadBinary, payloadType);
        return { messageKey, payload };
    }
    isFastPathPayload(payload) {
        if (payload == null) {
            return true;
        }
        const payloadType = typeof payload;
        if (payloadType === 'string' || payloadType === 'number') {
            return true;
        }
        if (payloadType === 'object' && payload.constructor === Object) {
            return true;
        }
        return false;
    }
    payloadToUint8Array(payload) {
        if (payload instanceof Uint8Array) {
            return payload;
        }
        else if (typeof payload === 'string') {
            return this.textEncoder.encode(payload);
        }
        else if (typeof payload === 'number') {
            const buffer = new ArrayBuffer(8);
            const view = new DataView(buffer);
            view.setFloat64(0, payload, false);
            return new Uint8Array(buffer);
        }
        else if (payload === null) {
            return new Uint8Array(0);
        }
        else if (payload === undefined) {
            return new Uint8Array(0);
        }
        else if (payload instanceof ArrayBuffer) {
            return new Uint8Array(payload);
        }
        else if (payload instanceof Blob) {
            throw new Error('Blob is not supported in this callsite.');
        }
        else {
            return this.textEncoder.encode(JSON.stringify(payload));
        }
    }
    packImpl({ messageKey, payload }, payloadType) {
        const messageKeyString = JSON.stringify(messageKey);
        const messageKeyBytes = this.textEncoder.encode(messageKeyString);
        const messageKeyLength = messageKeyBytes.length;
        const payloadBinary = this.payloadToUint8Array(payload);
        const totalLength = 4 + messageKeyLength + 1 + payloadBinary.byteLength;
        const buffer = new ArrayBuffer(totalLength);
        const packedArray = new Uint8Array(buffer);
        // [0] messageKeyLength (4 bytes)
        const messageKeyLengthView = new DataView(buffer, 0, 4);
        messageKeyLengthView.setUint32(0, messageKeyLength, false);
        // [1] messageKey (variable length)
        packedArray.set(messageKeyBytes, 4);
        // [2] payloadTypeIndicator (1 byte)
        const payloadTypeView = new DataView(buffer, 4 + messageKeyLength, 1);
        payloadTypeView.setUint8(0, payloadType ?? MessageFramePacker.getPayloadTypeIndicator(payload));
        // [3] payload (variable length)
        packedArray.set(payloadBinary, 4 + messageKeyLength + 1);
        return packedArray;
    }
    deserializePayload(payloadBinary, payloadTypeIndicator) {
        switch (payloadTypeIndicator) {
            case PayloadTypeIndicator.Uint8Array: {
                return new Uint8Array(payloadBinary);
            }
            case PayloadTypeIndicator.String: {
                return this.textDecoder.decode(payloadBinary);
            }
            case PayloadTypeIndicator.Number: {
                const view = new DataView(payloadBinary);
                return view.getFloat64(0, false);
            }
            case PayloadTypeIndicator.Null: {
                return null;
            }
            case PayloadTypeIndicator.Undefined: {
                return undefined;
            }
            case PayloadTypeIndicator.Object: {
                const jsonString = this.textDecoder.decode(payloadBinary);
                return JSON.parse(jsonString);
            }
            case PayloadTypeIndicator.ArrayBuffer: {
                return payloadBinary;
            }
            case PayloadTypeIndicator.Blob: {
                return new Blob([payloadBinary]);
            }
            default:
                throw new Error('Unsupported payload type');
        }
    }
    static getPayloadTypeIndicator(payload) {
        if (payload instanceof Uint8Array) {
            return PayloadTypeIndicator.Uint8Array;
        }
        else if (typeof payload === 'string') {
            return PayloadTypeIndicator.String;
        }
        else if (typeof payload === 'number') {
            return PayloadTypeIndicator.Number;
        }
        else if (payload === null) {
            return PayloadTypeIndicator.Null;
        }
        else if (payload === undefined) {
            return PayloadTypeIndicator.Undefined;
        }
        else if (payload instanceof ArrayBuffer) {
            return PayloadTypeIndicator.ArrayBuffer;
        }
        else if (payload instanceof Blob) {
            return PayloadTypeIndicator.Blob;
        }
        else if (typeof payload === 'object') {
            return PayloadTypeIndicator.Object;
        }
        else {
            throw new Error('Unsupported payload type');
        }
    }
}

;// CONCATENATED MODULE: ./src/WebSocketBackingStore.ts
/**
 * The backing store for the WebSocket connection and reference count.
 * This is used for connection multiplexing.
 */
class WebSocketBackingStore {
    ws;
    refCount;
    constructor(ws = null, refCount = 0) {
        this.ws = ws;
        this.refCount = refCount;
    }
}

;// CONCATENATED MODULE: ./src/WebSocketWithReconnect.ts
class WebSocketWithReconnect {
    url;
    retriesInterval;
    maxRetries;
    connectTimeout;
    onError;
    onReconnect;
    ws = null;
    retries = 0;
    connectTimeoutHandle = null;
    isClosed = false;
    sendQueue = [];
    lastCloseEvent = null;
    eventListeners;
    wsBinaryType;
    constructor(url, options) {
        this.url = url;
        this.retriesInterval = options?.retriesInterval ?? 1500;
        this.maxRetries = options?.maxRetries ?? 200;
        this.connectTimeout = options?.connectTimeout ?? 5000;
        this.onError =
            options?.onError ??
                ((error) => {
                    throw error;
                });
        this.onReconnect = options?.onReconnect ?? (() => { });
        this.wsBinaryType = options?.binaryType;
        this.eventListeners = Object.create(null);
        this.connect();
    }
    close(code, reason) {
        this.clearConnectTimeoutIfNeeded();
        this.emitEvent('close', (this.lastCloseEvent ?? {
            code: code ?? 1000,
            reason: reason ?? 'Explicit closing',
            message: 'Explicit closing',
        }));
        this.lastCloseEvent = null;
        this.isClosed = true;
        this.eventListeners = Object.create(null);
        this.sendQueue = [];
        if (this.ws != null) {
            const ws = this.ws;
            this.ws = null;
            this.wsClose(ws);
        }
    }
    addEventListener(event, listener) {
        const listeners = this.eventListeners[event] || (this.eventListeners[event] = new Set());
        listeners.add(listener);
    }
    removeEventListener(event, listener) {
        this.eventListeners[event]?.delete(listener);
    }
    //#region Internals
    connect() {
        if (this.ws != null) {
            return;
        }
        this.connectTimeoutHandle = setTimeout(this.handleConnectTimeout, this.connectTimeout);
        this.ws = new WebSocket(this.url.toString());
        if (this.wsBinaryType != null) {
            this.ws.binaryType = this.wsBinaryType;
        }
        this.ws.addEventListener('message', this.handleMessage);
        this.ws.addEventListener('open', this.handleOpen);
        // @ts-ignore TypeScript expects (e: Event) => any, but we want (e: WebSocketErrorEvent) => any
        this.ws.addEventListener('error', this.handleError);
        this.ws.addEventListener('close', this.handleClose);
    }
    send(data) {
        if (this.isClosed) {
            this.onError(new Error('Unable to send data: WebSocket is closed'));
            return;
        }
        if (this.retries >= this.maxRetries) {
            this.onError(new Error(`Unable to send data: Exceeded max retries - retries[${this.retries}]`));
            return;
        }
        const ws = this.ws;
        if (ws != null && ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
        else {
            this.sendQueue.push(data);
        }
    }
    emitEvent(event, payload) {
        const listeners = this.eventListeners[event];
        if (listeners) {
            for (const listener of listeners) {
                listener(payload);
            }
        }
    }
    handleOpen = () => {
        this.clearConnectTimeoutIfNeeded();
        this.lastCloseEvent = null;
        this.emitEvent('open');
        const sendQueue = this.sendQueue;
        this.sendQueue = [];
        for (const data of sendQueue) {
            this.send(data);
        }
    };
    handleMessage = (event) => {
        this.emitEvent('message', event);
    };
    handleError = (event) => {
        this.clearConnectTimeoutIfNeeded();
        this.emitEvent('error', event);
        this.reconnectIfNeeded(`WebSocket error - ${event.message}`);
    };
    handleClose = (event) => {
        this.clearConnectTimeoutIfNeeded();
        this.lastCloseEvent = {
            code: event.code,
            reason: event.reason,
            message: event.message,
        };
        this.reconnectIfNeeded(`WebSocket closed - code[${event.code}] reason[${event.reason}]`);
    };
    handleConnectTimeout = () => {
        this.reconnectIfNeeded('Timeout from connecting to the WebSocket');
    };
    clearConnectTimeoutIfNeeded() {
        if (this.connectTimeoutHandle != null) {
            clearTimeout(this.connectTimeoutHandle);
            this.connectTimeoutHandle = null;
        }
    }
    reconnectIfNeeded(reason) {
        if (this.ws != null) {
            this.wsClose(this.ws);
            this.ws = null;
        }
        if (this.isClosed) {
            return;
        }
        if (this.retries >= this.maxRetries) {
            this.onError(new Error('Exceeded max retries'));
            this.close();
            return;
        }
        setTimeout(() => {
            this.retries += 1;
            this.connect();
            this.onReconnect(reason);
        }, this.retriesInterval);
    }
    wsClose(ws) {
        try {
            ws.removeEventListener('message', this.handleMessage);
            ws.removeEventListener('open', this.handleOpen);
            ws.removeEventListener('close', this.handleClose);
            // WebSocket throws errors if we don't handle the error event.
            // Specifically when closing a ws in CONNECTING readyState,
            // WebSocket will have `WebSocket was closed before the connection was established` error.
            // We won't like to have the exception, so set a noop error handler.
            ws.onerror = () => { };
            ws.close();
        }
        catch { }
    }
    get readyState() {
        // Only return closed if the WebSocket is explicitly closed or exceeds max retries.
        if (this.isClosed) {
            return WebSocket.CLOSED;
        }
        const readyState = this.ws?.readyState;
        if (readyState === WebSocket.CLOSED) {
            return WebSocket.CONNECTING;
        }
        return readyState ?? WebSocket.CONNECTING;
    }
    //#endregion
    //#region WebSocket API proxy
    CONNECTING = 0;
    OPEN = 1;
    CLOSING = 2;
    CLOSED = 3;
    get binaryType() {
        return this.ws?.binaryType ?? 'blob';
    }
    get bufferedAmount() {
        return this.ws?.bufferedAmount ?? 0;
    }
    get extensions() {
        return this.ws?.extensions ?? '';
    }
    get protocol() {
        return this.ws?.protocol ?? '';
    }
    ping() {
        // @ts-ignore react-native WebSocket has the ping method
        return this.ws?.ping();
    }
    dispatchEvent(event) {
        return this.ws?.dispatchEvent(event) ?? false;
    }
    //#endregion
    //#regions Unsupported legacy properties
    set onclose(_value) {
        throw new Error('Unsupported legacy property, use addEventListener instead');
    }
    set onerror(_value) {
        throw new Error('Unsupported legacy property, use addEventListener instead');
    }
    set onmessage(_value) {
        throw new Error('Unsupported legacy property, use addEventListener instead');
    }
    set onopen(_value) {
        throw new Error('Unsupported legacy property, use addEventListener instead');
    }
}

;// CONCATENATED MODULE: ./src/DevToolsPluginClient.ts





/**
 * This client is for the Expo DevTools Plugins to communicate between the app and the DevTools webpage hosted in a browser.
 * All the code should be both compatible with browsers and React Native.
 */
class DevToolsPluginClient {
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
            warn('Unable to send message in a disconnected state.');
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
            warn('Unable to send message in a disconnected state.');
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
            const protocol = this.connectionInfo.useWss ? 'wss' : 'ws';
            const ws = new WebSocketWithReconnect(`${protocol}://${this.connectionInfo.devServer}/${endpoint}`, {
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
                info('WebSocket closed', e.code, e.reason);
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
            warn('Unsupported received data type in handleMessageImpl');
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

;// CONCATENATED MODULE: ./src/DevToolsPluginClientImplApp.ts


/**
 * The DevToolsPluginClient for the app -> browser communication.
 */
class DevToolsPluginClientImplApp extends DevToolsPluginClient {
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
        this.addHandskakeMessageListener((params) => {
            if (params.method === 'handshake') {
                const { pluginName, protocolVersion } = params;
                // [0] Check protocol version
                if (protocolVersion !== this.connectionInfo.protocolVersion) {
                    // Use console.warn than logger because we want to show the warning even logging is disabled.
                    console.warn(`Received an incompatible devtools plugin handshake message - pluginName[${pluginName}]`);
                    this.terminateBrowserClient(pluginName, params.browserClientId);
                    return;
                }
                // [1] Terminate duplicated browser clients for the same plugin
                const previousBrowserClientId = this.browserClientMap[pluginName];
                if (previousBrowserClientId != null && previousBrowserClientId !== params.browserClientId) {
                    info(`Terminate the previous browser client connection - previousBrowserClientId[${previousBrowserClientId}]`);
                    this.terminateBrowserClient(pluginName, previousBrowserClientId);
                }
                this.browserClientMap[pluginName] = params.browserClientId;
            }
        });
    }
    terminateBrowserClient(pluginName, browserClientId) {
        this.sendHandshakeMessage({
            protocolVersion: this.connectionInfo.protocolVersion,
            method: 'terminateBrowserClient',
            browserClientId,
            pluginName,
        });
    }
}

;// CONCATENATED MODULE: ./src/DevToolsPluginClientImplBrowser.ts


/**
 * The DevToolsPluginClient for the browser -> app communication.
 */
class DevToolsPluginClientImplBrowser extends DevToolsPluginClient {
    browserClientId = Date.now().toString();
    /**
     * Initialize the connection.
     * @hidden
     */
    async initAsync() {
        await super.initAsync();
        this.startHandshake();
    }
    startHandshake() {
        this.addHandskakeMessageListener((params) => {
            if (params.method === 'terminateBrowserClient' &&
                this.browserClientId === params.browserClientId) {
                info('Received terminateBrowserClient messages and terminate the current connection');
                this.closeAsync();
            }
        });
        this.sendHandshakeMessage({
            protocolVersion: this.connectionInfo.protocolVersion,
            pluginName: this.connectionInfo.pluginName,
            method: 'handshake',
            browserClientId: this.browserClientId,
        });
    }
}

;// CONCATENATED MODULE: ./src/ProtocolVersion.ts
/**
 * A transport protocol version between the app and the webui.
 * It shows a warning in handshaking stage if the version is different between the app and the webui.
 * The value should be increased when the protocol is changed.
 */
const PROTOCOL_VERSION = 1;

;// CONCATENATED MODULE: ./src/getConnectionInfo.ts
/**
 * Get the dev server address.
 */

function getConnectionInfo() {
    const devServerQuery = new URLSearchParams(window.location.search).get('devServer');
    const host = window.location.origin.replace(/^https?:\/\//, '');
    return {
        protocolVersion: PROTOCOL_VERSION,
        sender: 'browser',
        devServer: devServerQuery || host,
        useWss: window.location.protocol === 'https:',
    };
}

;// CONCATENATED MODULE: ./src/DevToolsPluginClientFactory.ts



const instanceMap = {};
/**
 * Factory of DevToolsPluginClient based on sender types.
 * @hidden
 */
async function createDevToolsPluginClient(connectionInfo, options) {
    let client;
    if (connectionInfo.sender === 'app') {
        client = new DevToolsPluginClientImplApp(connectionInfo, options);
    }
    else {
        client = new DevToolsPluginClientImplBrowser(connectionInfo, options);
    }
    await client.initAsync();
    return client;
}
/**
 * Public API to get the DevToolsPluginClient instance.
 */
async function getDevToolsPluginClientAsync(pluginName, options) {
    const connectionInfo = getConnectionInfo();
    let instance = instanceMap[pluginName];
    if (instance != null) {
        if (instance instanceof Promise) {
            return instance;
        }
        if (instance.isConnected() === false ||
            instance.connectionInfo.devServer !== connectionInfo.devServer) {
            await instance.closeAsync();
            delete instanceMap[pluginName];
            instance = null;
        }
    }
    if (instance == null) {
        const instancePromise = createDevToolsPluginClient({ ...connectionInfo, pluginName }, options);
        instanceMap[pluginName] = instancePromise;
        instance = await instancePromise;
        instanceMap[pluginName] = instance;
    }
    return instance;
}
/**
 * Internal testing API to cleanup all DevToolsPluginClient instances.
 */
function cleanupDevToolsPluginInstances() {
    for (const pluginName of Object.keys(instanceMap)) {
        const instance = instanceMap[pluginName];
        delete instanceMap[pluginName];
        if (instance instanceof Promise) {
            instance.then((instance) => instance.closeAsync());
        }
        else {
            instance.closeAsync();
        }
    }
}

;// CONCATENATED MODULE: ./src/startCliListenerAsync.ts
let didWarnAboutUsage = false;
/**
 * Dummy implementation of the `startDevToolsPluginListenerAsync` function for platforms
 * that do not support it, such as web or non-native environments.
 */
const startCliListenerAsync = async (_pluginName) => {
    if (!didWarnAboutUsage) {
        didWarnAboutUsage = true;
        console.warn('The startCliListenerAsync function is not supported on this platform. Please use the native version instead.');
    }
    return {
        addMessageListener: () => { },
        sendMessageAsync: () => Promise.resolve(),
    };
};

;// CONCATENATED MODULE: ./src/CliExtensionUtils.ts
class SendMessageError extends Error {
    app;
    constructor(message, app) {
        super(message);
        this.app = app;
    }
}

;// CONCATENATED MODULE: ./src/sendCliMessage.ts

// We'd like this to be fairly quick, and at least a bit shorter
// than Metro's own timeout (10 seconds) to be able to report errors before Metro does.
const DEFAULT_TIMEOUT_MS = 5_000;
/**
 * Sends out a message to the WebSocket server using a broadcast channel and waits for a response.
 * If the connection times out or an error occurs, it rejects the promise with an error.
 * @param message Message to send to the WebSocket server.
 * @param pluginName Name of the plugin to send the message to. This is used to identify the plugin in the WebSocket server.
 * @param apps Apps to send the message to. This is an array of `MetroInspectorApp` objects.
 * @param timeoutMs Timeout in milliseconds to wait for a response. Defaults to 10 seconds.
 */
async function sendCliMessageAsync(message, pluginName, apps, timeoutMs = DEFAULT_TIMEOUT_MS) {
    // Sanity check: ensure that all apps share the same WebSocket URL
    if (apps.length === 0) {
        return Promise.reject(new Error('No apps provided to send the message to.'));
    }
    // Check that all apps share the same broadcast URL
    if (apps.some((app) => new URL(app.webSocketDebuggerUrl).host !== new URL(apps[0].webSocketDebuggerUrl).host)) {
        return Promise.reject(new SendMessageError('All apps should share the same WebSocket URL hostname to send messages.' +
            apps[0].webSocketDebuggerUrl, apps[0]));
    }
    // Create connection
    const url = new URL(apps[0].webSocketDebuggerUrl);
    const address = `ws://${url.host}/expo-dev-plugins/broadcast`;
    // Create results for all apps
    const results = apps.reduce((acc, app) => ({
        ...acc,
        [app.id]: null,
    }), {});
    // Create a websocket connection to the broadcast channel
    const ws = new WebSocket(address);
    // Lets do the rest of the handling in the event listeners through a promise that will be resolved
    // when we get a response for the message we sent
    return new Promise((resolve, reject) => {
        // Setup timeout handler
        const timeoutHandler = setTimeout(() => {
            // Close the WebSocket to allow the process to exit
            ws.close();
            // Check if no results are resolved - this is an error:
            if (Object.values(results).every((result) => result === null)) {
                const errorMessage = `Timeout while waiting for response from apps.`;
                reject(new SendMessageError(errorMessage, apps.find((a) => results[a.id] === null)));
            }
            else if (Object.values(results).some((result) => result !== null)) {
                // We got partial results - this is ok, but with a warning - update results for each of the apps
                // that didn't respond with a warning message
                Object.keys(results).forEach((key) => {
                    if (results[key] === null) {
                        results[key] = 'No response (timeout)';
                    }
                });
                resolve(results);
            }
            // Clear the timeout handler
            clearTimeout(timeoutHandler);
        }, timeoutMs);
        ws.addEventListener('message', ({ data }) => {
            const parsedData = parseWebSocketData(data);
            const { messageKey, payload } = parsedData;
            if (messageKey.pluginName === pluginName && messageKey.method === message + '_response') {
                // We got a response for our message. Now get the app ID and result
                const { deviceName, applicationId } = payload;
                const result = payload.message;
                const app = apps.find((app) => getDeviceIdentifier(app) === formatDeviceIdentifier(deviceName, applicationId));
                if (!app) {
                    reject(new Error(`Received response for unknown app: ${deviceName} (${applicationId}). Ignoring.`));
                    return;
                }
                results[app.id] = result.toString();
                // Check if we have results for all apps
                if (Object.values(results).every((result) => result !== null)) {
                    clearTimeout(timeoutHandler);
                    ws.close();
                    // Resolve the promise with the results
                    resolve(results);
                }
            }
        });
        ws.addEventListener('open', () => {
            // On Open we'll send the message to the broadcast channel
            const messageKey = getMessageKey(pluginName, message);
            ws.send(JSON.stringify({ messageKey, payload: { from: 'cli' } }));
        });
        ws.addEventListener('error', () => {
            clearTimeout(timeoutHandler);
            ws.close();
            console.error(`Failed to connect to the WebSocket server at ${url}`);
            reject(new Error(`Failed to connect to the WebSocket server at ${url}`));
        });
        ws.addEventListener('close', () => {
            clearTimeout(timeoutHandler);
        });
    });
}
const getMessageKey = (pluginName, method) => ({
    pluginName,
    method,
});
function parseWebSocketData(data) {
    if (typeof data === 'string') {
        return JSON.parse(data);
    }
    else if (data instanceof Buffer) {
        return JSON.parse(data.toString());
    }
    else if (data instanceof ArrayBuffer) {
        return JSON.parse(Buffer.from(data).toString());
    }
    else if (Array.isArray(data)) {
        return JSON.parse(Buffer.concat(data).toString());
    }
    throw new Error('Unsupported WebSocket data type');
}
const getDeviceIdentifier = (app) => {
    // Use the deviceName + app ID as the device identifier
    return formatDeviceIdentifier(app.deviceName, app.appId);
};
const formatDeviceIdentifier = (deviceName, applicationId) => {
    // Use the deviceName + app ID as the device identifier
    return `${deviceName} (${applicationId})`;
};

;// CONCATENATED MODULE: external "util"
const external_util_namespaceObject = require("util");
;// CONCATENATED MODULE: ./src/runCliExtension.ts

/**
 * Executes an Expo CLI extension command with the provided executor function.
 * This function retrieves the command, arguments, and connected applications,
 * then calls the executor with these parameters.
 *
 * @param executor - A function that takes a command, arguments, and connected applications,
 *                   and returns a Promise that resolves when the command execution is complete.
 */
async function runCliExtension(executor) {
    const params = getExpoCliPluginParameters(process.argv);
    try {
        await executor(params, CliExtensionConsole);
    }
    catch (error) {
        for (const line of formatCliExtensionErrorLines(error)) {
            CliExtensionConsole.error(line);
        }
    }
}
/**
 * Returns typed parameters for an Expo CLI plugin. (exported for testing)
 * Parameters are read from the process.
 */
const getExpoCliPluginParameters = (argv) => {
    // Extract command, args, and apps from process arguments
    const command = argv[2]?.toLowerCase();
    const argsString = argv[3] ?? '{}';
    const metroServerOrigin = argv[4] ?? '';
    // Verify command exists
    if (!command) {
        throw new Error('No command provided.');
    }
    let args = {};
    if (!metroServerOrigin || typeof metroServerOrigin !== 'string') {
        throw new Error('Invalid metroServerOrigin parameter. It must be a non-empty string.');
    }
    try {
        args = JSON.parse(argsString);
    }
    catch (error) {
        throw new Error(`Invalid args JSON: ${error instanceof Error ? error.message : 'Unknown error'} - ${argv.join(', ')}`);
    }
    if (Array.isArray(args) || typeof args !== 'object') {
        throw new Error('Expected object for args parameter, got ' + JSON.stringify(args));
    }
    return {
        command,
        args,
        metroServerOrigin,
    };
};

// --------------- LOGGING HELPERS  ---------------
/**
 * We're wrapping console methods to output structured JSON messages.
 */
const asJson = (level, message, args) => JSON.stringify([{ type: 'text', text: (0,external_util_namespaceObject.format)(message, ...args), level }]);
const CliExtensionConsole = {
    log: (message, ...args) => console.log(asJson('info', message, args)),
    info: (message, ...args) => console.log(asJson('info', message, args)),
    warn: (message, ...args) => console.error(asJson('warning', message, args)),
    error: (message, ...args) => console.error(asJson('error', message, args)),
    uri: (uri, altText) => {
        console.log(JSON.stringify([{ type: 'uri', uri, altText }]));
    },
};
// --------------- ERROR HELPERS  ---------------
const stripErrorPrefix = (message) => message.replace(/^Error:\s*/i, '');
const getErrorMessage = (value) => {
    if (value instanceof Error && value.message) {
        return stripErrorPrefix(value.message);
    }
    if (typeof value === 'string') {
        return stripErrorPrefix(value);
    }
    return stripErrorPrefix(String(value));
};
const getErrorCause = (value) => (value instanceof Error ? value.cause : undefined);
const formatCliExtensionErrorLines = (error) => {
    const mainMessage = getErrorMessage(error) || 'Unknown error';
    const lines = [mainMessage];
    const maxCauses = 3;
    let cause = getErrorCause(error);
    let collected = 0;
    let remaining = 0;
    while (cause) {
        if (collected < maxCauses) {
            lines.push(getErrorMessage(cause));
            collected += 1;
        }
        else {
            remaining += 1;
        }
        cause = getErrorCause(cause);
    }
    if (remaining > 0) {
        lines.push(`…and ${remaining} more issues`);
    }
    return lines;
};

;// CONCATENATED MODULE: ./src/CliJSInspector.ts
async function queryAllInspectorAppsAsync(metroServerOrigin) {
    const resp = await fetch(`${metroServerOrigin}/json/list`);
    // The newest runtime will be at the end of the list,
    // reversing the result would save time from try-error.
    return (await resp.json()).reverse().filter(pageIsSupported);
}
function pageIsSupported(app) {
    const capabilities = app.reactNative?.capabilities ?? {};
    return 'nativePageReloads' in capabilities && capabilities.nativePageReloads === true;
}

;// CONCATENATED MODULE: ./src/index.node.ts
// Node.js entry point - excludes React hooks that require React Native



// Unstable APIs exported for testing purposes.



// CLI Extension exports





module.exports = __webpack_exports__;
/******/ })()
;
