export interface Options {
    /**
     * Reconnect interval in milliseconds.
     * @default 1500
     */
    retriesInterval?: number;
    /**
     * The maximum number of retries.
     * @default 200
     */
    maxRetries?: number;
    /**
     * The timeout in milliseconds for the WebSocket connecting.
     */
    connectTimeout?: number;
    /**
     * The error handler.
     * @default throwing an error
     */
    onError?: (error: Error) => void;
    /**
     * The callback to be called when the WebSocket is reconnected.
     * @default no-op
     */
    onReconnect?: (reason: string) => void;
}
export declare class WebSocketWithReconnect implements WebSocket {
    readonly url: string;
    private readonly retriesInterval;
    private readonly maxRetries;
    private readonly connectTimeout;
    private readonly onError;
    private readonly onReconnect;
    private ws;
    private retries;
    private connectTimeoutHandle;
    private isClosed;
    private sendQueue;
    private lastCloseEvent;
    private readonly emitter;
    private readonly eventSubscriptions;
    constructor(url: string, options?: Options);
    close(code?: number, reason?: string): void;
    addEventListener(event: 'message', listener: (event: WebSocketMessageEvent) => void): void;
    addEventListener(event: 'open', listener: () => void): void;
    addEventListener(event: 'error', listener: (event: WebSocketErrorEvent) => void): void;
    addEventListener(event: 'close', listener: (event: WebSocketCloseEvent) => void): void;
    removeEventListener(event: string, listener: (event: any) => void): void;
    private connect;
    send(data: string | ArrayBufferView | Blob | ArrayBufferLike): void;
    private handleOpen;
    private handleMessage;
    private handleError;
    private handleClose;
    private handleConnectTimeout;
    private clearConnectTimeoutIfNeeded;
    private reconnectIfNeeded;
    private wsClose;
    get readyState(): number;
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;
    get binaryType(): BinaryType;
    get bufferedAmount(): number;
    get extensions(): string;
    get protocol(): string;
    ping(): void;
    dispatchEvent(event: Event): boolean;
    set onclose(value: ((e: WebSocketCloseEvent) => any) | null);
    set onerror(value: ((e: Event) => any) | null);
    set onmessage(value: ((e: WebSocketMessageEvent) => any) | null);
    set onopen(value: (() => any) | null);
}
//# sourceMappingURL=WebSocketWithReconnect.d.ts.map