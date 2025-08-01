export class WebSocketWithReconnect {
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
//# sourceMappingURL=WebSocketWithReconnect.js.map