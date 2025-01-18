import { EventEmitter, type EventSubscription } from 'fbemitter';

import type { DevToolsPluginClientOptions } from './devtools.types';

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

  /**
   * The [`binaryType`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/binaryType).
   */
  binaryType?: DevToolsPluginClientOptions['websocketBinaryType'];
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
  private lastCloseEvent: { code?: number; reason?: string; message?: string } | null = null;

  private readonly emitter = new EventEmitter();
  private readonly eventSubscriptions: EventSubscription[] = [];
  private readonly wsBinaryType?: Options['binaryType'];

  constructor(
    public readonly url: string,
    options?: Options
  ) {
    this.retriesInterval = options?.retriesInterval ?? 1500;
    this.maxRetries = options?.maxRetries ?? 200;
    this.connectTimeout = options?.connectTimeout ?? 5000;
    this.onError =
      options?.onError ??
      ((error) => {
        throw error;
      });
    this.onReconnect = options?.onReconnect ?? (() => {});
    this.wsBinaryType = options?.binaryType;

    this.connect();
  }

  public close(code?: number, reason?: string) {
    this.clearConnectTimeoutIfNeeded();
    this.emitter.emit(
      'close',
      this.lastCloseEvent ?? {
        code: code ?? 1000,
        reason: reason ?? 'Explicit closing',
        message: 'Explicit closing',
      }
    );
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

  public addEventListener(event: 'message', listener: (event: WebSocketMessageEvent) => void): void;
  public addEventListener(event: 'open', listener: () => void): void;
  public addEventListener(event: 'error', listener: (event: WebSocketErrorEvent) => void): void;
  public addEventListener(event: 'close', listener: (event: WebSocketCloseEvent) => void): void;
  public addEventListener(event: string, listener: (event: any) => void) {
    this.eventSubscriptions.push(this.emitter.addListener(event, listener));
  }

  public removeEventListener(_event: string, listener: (event: any) => void) {
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
    if (this.wsBinaryType != null) {
      this.ws.binaryType = this.wsBinaryType;
    }
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
    this.clearConnectTimeoutIfNeeded();
    this.lastCloseEvent = null;
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
    this.clearConnectTimeoutIfNeeded();
    this.emitter.emit('error', event);
    this.reconnectIfNeeded(`WebSocket error - ${event.message}`);
  };

  private handleClose = (event: WebSocketCloseEvent) => {
    this.clearConnectTimeoutIfNeeded();
    this.lastCloseEvent = {
      code: event.code,
      reason: event.reason,
      message: event.message,
    };
    this.reconnectIfNeeded(`WebSocket closed - code[${event.code}] reason[${event.reason}]`);
  };

  private handleConnectTimeout = () => {
    this.reconnectIfNeeded('Timeout from connecting to the WebSocket');
  };

  private clearConnectTimeoutIfNeeded() {
    if (this.connectTimeoutHandle != null) {
      clearTimeout(this.connectTimeoutHandle);
      this.connectTimeoutHandle = null;
    }
  }

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
      this.close();
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
      ws.removeEventListener('close', this.handleClose);

      // WebSocket throws errors if we don't handle the error event.
      // Specifically when closing a ws in CONNECTING readyState,
      // WebSocket will have `WebSocket was closed before the connection was established` error.
      // We won't like to have the exception, so set a noop error handler.
      ws.onerror = () => {};

      ws.close();
    } catch {}
  }

  public get readyState() {
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

  public readonly CONNECTING = 0;
  public readonly OPEN = 1;
  public readonly CLOSING = 2;
  public readonly CLOSED = 3;

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

  public set onclose(_value: ((e: WebSocketCloseEvent) => any) | null) {
    throw new Error('Unsupported legacy property, use addEventListener instead');
  }

  public set onerror(_value: ((e: Event) => any) | null) {
    throw new Error('Unsupported legacy property, use addEventListener instead');
  }

  public set onmessage(_value: ((e: WebSocketMessageEvent) => any) | null) {
    throw new Error('Unsupported legacy property, use addEventListener instead');
  }

  public set onopen(_value: (() => any) | null) {
    throw new Error('Unsupported legacy property, use addEventListener instead');
  }

  //#endregion
}
