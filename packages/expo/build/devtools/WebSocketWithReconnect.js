import { EventEmitter } from 'fbemitter';
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
    emitter = new EventEmitter();
    eventSubscriptions = [];
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
        this.connect();
    }
    close(code, reason) {
        this.clearConnectTimeoutIfNeeded();
        this.emitter.emit('close', this.lastCloseEvent ?? {
            code: code ?? 1000,
            reason: reason ?? 'Explicit closing',
            message: 'Explicit closing',
        });
        this.lastCloseEvent = null;
        this.isClosed = true;
        this.emitter.removeAllListeners();
        this.sendQueue = [];
        if (this.ws != null) {
            const ws = this.ws;
            this.ws = null;
            this.wsClose(ws);
        }
    }
    addEventListener(event, listener) {
        this.eventSubscriptions.push(this.emitter.addListener(event, listener));
    }
    removeEventListener(event, listener) {
        const index = this.eventSubscriptions.findIndex((subscription) => subscription.listener === listener);
        if (index >= 0) {
            this.eventSubscriptions[index].remove();
            this.eventSubscriptions.splice(index, 1);
        }
    }
    //#region Internals
    connect() {
        if (this.ws != null) {
            return;
        }
        this.connectTimeoutHandle = setTimeout(this.handleConnectTimeout, this.connectTimeout);
        this.ws = new WebSocket(this.url.toString());
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
    handleOpen = () => {
        this.clearConnectTimeoutIfNeeded();
        this.lastCloseEvent = null;
        this.emitter.emit('open');
        const sendQueue = this.sendQueue;
        this.sendQueue = [];
        for (const data of sendQueue) {
            this.send(data);
        }
    };
    handleMessage = (event) => {
        this.emitter.emit('message', event);
    };
    handleError = (event) => {
        this.clearConnectTimeoutIfNeeded();
        this.emitter.emit('error', event);
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
            // @ts-ignore: TypeScript expects (e: Event) => any, but we want (e: WebSocketErrorEvent) => any
            ws.removeEventListener('error', this.handleError);
            ws.removeEventListener('close', this.handleClose);
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
        // @ts-expect-error
        return this.ws?.ping();
    }
    dispatchEvent(event) {
        return this.ws?.dispatchEvent(event) ?? false;
    }
    //#endregion
    //#regions Unsupported legacy properties
    set onclose(value) {
        throw new Error('Unsupported legacy property, use addEventListener instead');
    }
    set onerror(value) {
        throw new Error('Unsupported legacy property, use addEventListener instead');
    }
    set onmessage(value) {
        throw new Error('Unsupported legacy property, use addEventListener instead');
    }
    set onopen(value) {
        throw new Error('Unsupported legacy property, use addEventListener instead');
    }
}
//# sourceMappingURL=WebSocketWithReconnect.js.map