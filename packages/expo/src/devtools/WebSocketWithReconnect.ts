import { EventEmitter, type EventSubscription } from 'fbemitter';

export interface Options {
  /**
   * Reconnect interval in milliseconds.
   * @default 2000
   */
  retriesInterval?: number;

  /**
   * The maximum number of retries.
   * @default 10
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

export class WebSocketWithReconnect implements WebSocket {
  private readonly retriesInterval: number;
  private readonly maxRetries: number;
  private readonly connectTimeout: number;
  private readonly onError: (error: Error) => void;
  private readonly onReconnect: (reason: string) => void;

  private ws: WebSocket | null = null;
  private retries = 0;
  private connectTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private isClosed = false;
  private sendQueue: (string | ArrayBufferView | Blob | ArrayBufferLike)[] = [];

  private readonly emitter = new EventEmitter();
  private readonly eventSubscriptions: EventSubscription[] = [];

  constructor(
    public readonly url: string,
    options?: Options
  ) {
    this.retriesInterval = options?.retriesInterval ?? 1000;
    this.maxRetries = options?.maxRetries ?? 10;
    this.connectTimeout = options?.connectTimeout ?? 5000;
    this.onError =
      options?.onError ??
      ((error) => {
        throw error;
      });
    this.onReconnect = options?.onReconnect ?? (() => {});

    this.connect();
  }

  public close() {
    if (this.connectTimeoutHandle != null) {
      clearTimeout(this.connectTimeoutHandle);
      this.connectTimeoutHandle = null;
    }
    this.isClosed = true;
    this.emitter.removeAllListeners();
    this.sendQueue = [];
    if (this.ws != null) {
      const ws = this.ws;
      this.ws = null;
      this.wsClose(ws);
    }
  }

  public addEventListener(event: 'message', listener: (event: WebSocketMessageEvent) => void): void;
  public addEventListener(event: 'open', listener: () => void): void;
  public addEventListener(event: 'error', listener: (event: WebSocketErrorEvent) => void): void;
  public addEventListener(event: 'close', listener: (event: WebSocketCloseEvent) => void): void;
  public addEventListener(event: string, listener: (event: any) => void) {
    this.eventSubscriptions.push(this.emitter.addListener(event, listener));
  }

  public removeEventListener(event: string, listener: (event: any) => void) {
    const index = this.eventSubscriptions.findIndex(
      (subscription) => subscription.listener === listener
    );
    if (index >= 0) {
      this.eventSubscriptions[index].remove();
      this.eventSubscriptions.splice(index, 1);
    }
  }

  //#region Internals

  private connect() {
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

  public send(data: string | ArrayBufferView | Blob | ArrayBufferLike): void {
    if (this.isClosed) {
      this.onError(new Error('Unable to send data: WebSocket is closed'));
      return;
    }

    if (this.retries >= this.maxRetries) {
      this.onError(
        new Error(`Unable to send data: Exceeded max retries - retries[${this.retries}]`)
      );
      return;
    }

    const ws = this.ws;
    if (ws != null && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    } else {
      this.sendQueue.push(data);
    }
  }

  private handleOpen = () => {
    if (this.connectTimeoutHandle != null) {
      clearTimeout(this.connectTimeoutHandle);
      this.connectTimeoutHandle = null;
    }
    this.emitter.emit('open');

    const sendQueue = this.sendQueue;
    this.sendQueue = [];
    for (const data of sendQueue) {
      this.send(data);
    }
  };

  private handleMessage = (event: WebSocketMessageEvent) => {
    this.emitter.emit('message', event);
  };

  private handleError = (event: WebSocketErrorEvent) => {
    this.emitter.emit('error', event);
    this.reconnectIfNeeded(`WebSocket error - ${event.message}`);
  };

  private handleClose = (event: WebSocketCloseEvent) => {
    this.emitter.emit('close', event);
    this.reconnectIfNeeded(`WebSocket closed - code[${event.code}] reason[${event.reason}]`);
  };

  private handleConnectTimeout = () => {
    this.reconnectIfNeeded('Timeout from connecting to the WebSocket');
  };

  private reconnectIfNeeded(reason: string) {
    if (this.ws != null) {
      this.wsClose(this.ws);
      this.ws = null;
    }
    if (this.isClosed) {
      return;
    }

    if (this.retries >= this.maxRetries) {
      this.onError(new Error('Exceeded max retries'));
      return;
    }

    setTimeout(() => {
      this.retries += 1;
      this.connect();
      this.onReconnect(reason);
    }, this.retriesInterval);
  }

  private wsClose(ws: WebSocket) {
    try {
      ws.removeEventListener('message', this.handleMessage);
      ws.removeEventListener('open', this.handleOpen);
      // @ts-ignore: TypeScript expects (e: Event) => any, but we want (e: WebSocketErrorEvent) => any
      ws.removeEventListener('error', this.handleError);
      ws.removeEventListener('close', this.handleClose);
      ws.close();
    } catch {}
  }

  //#endregion

  //#region WebSocket API proxy

  public readonly CONNECTING = 0;
  public readonly OPEN = 1;
  public readonly CLOSING = 2;
  public readonly CLOSED = 3;

  public get readyState() {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  public get binaryType() {
    return this.ws?.binaryType ?? 'blob';
  }

  public get bufferedAmount() {
    return this.ws?.bufferedAmount ?? 0;
  }

  public get extensions() {
    return this.ws?.extensions ?? '';
  }

  public get protocol() {
    return this.ws?.protocol ?? '';
  }

  public ping(): void {
    return this.ws?.ping();
  }

  public dispatchEvent(event: Event) {
    return this.ws?.dispatchEvent(event) ?? false;
  }

  //#endregion

  //#regions Unsupported legacy properties

  public set onclose(value: ((e: WebSocketCloseEvent) => any) | null) {
    throw new Error('Unsupported legacy property, use addEventListener instead');
  }

  public set onerror(value: ((e: Event) => any) | null) {
    throw new Error('Unsupported legacy property, use addEventListener instead');
  }

  public set onmessage(value: ((e: WebSocketMessageEvent) => any) | null) {
    throw new Error('Unsupported legacy property, use addEventListener instead');
  }

  public set onopen(value: (() => any) | null) {
    throw new Error('Unsupported legacy property, use addEventListener instead');
  }

  //#endregion
}
