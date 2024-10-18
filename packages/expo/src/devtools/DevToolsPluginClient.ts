import { EventEmitter, EventSubscription } from 'fbemitter';

import { MessageFramePacker } from './MessageFramePacker';
import { WebSocketBackingStore } from './WebSocketBackingStore';
import { WebSocketWithReconnect } from './WebSocketWithReconnect';
import { blobToArrayBufferAsync } from './blobUtils';
import type { ConnectionInfo, DevToolsPluginClientOptions } from './devtools.types';
import * as logger from './logger';

interface MessageFramePackerMessageKey {
  pluginName: string;
  method: string;
}

/**
 * This client is for the Expo DevTools Plugins to communicate between the app and the DevTools webpage hosted in a browser.
 * All the code should be both compatible with browsers and React Native.
 */
export abstract class DevToolsPluginClient {
  protected eventEmitter: EventEmitter = new EventEmitter();

  private static defaultWSStore: WebSocketBackingStore = new WebSocketBackingStore();
  private readonly wsStore: WebSocketBackingStore = DevToolsPluginClient.defaultWSStore;

  protected isClosed = false;
  protected retries = 0;
  private readonly messageFramePacker: MessageFramePacker<MessageFramePackerMessageKey> =
    new MessageFramePacker();

  public constructor(
    public readonly connectionInfo: ConnectionInfo,
    private readonly options?: DevToolsPluginClientOptions
  ) {
    this.wsStore = connectionInfo.wsStore || DevToolsPluginClient.defaultWSStore;
  }

  /**
   * Initialize the connection.
   * @hidden
   */
  public async initAsync(): Promise<void> {
    if (this.wsStore.ws == null) {
      this.wsStore.ws = await this.connectAsync();
    }
    this.wsStore.refCount += 1;
    this.wsStore.ws.addEventListener('message', this.handleMessage);
  }

  /**
   * Close the connection.
   */
  public async closeAsync(): Promise<void> {
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
  public sendMessage(method: string, params: any) {
    if (this.wsStore.ws?.readyState === WebSocket.CLOSED) {
      logger.warn('Unable to send message in a disconnected state.');
      return;
    }
    this.sendMessageImpl(method, params);
  }

  private async sendMessageImpl(method: string, params: any) {
    const messageKey: MessageFramePackerMessageKey = {
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
  public addMessageListener(method: string, listener: (params: any) => void): EventSubscription {
    return this.eventEmitter.addListener(method, listener);
  }

  /**
   * Subscribe to a message from the other end of DevTools just once.
   * @param method Subscribe to a message with a method name.
   * @param listener Listener to be called when a message is received.
   */
  public addMessageListenerOnce(method: string, listener: (params: any) => void): void {
    this.eventEmitter.once(method, listener);
  }

  /**
   * Returns whether the client is connected to the server.
   */
  public isConnected(): boolean {
    return this.wsStore.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * The method to create the WebSocket connection.
   */
  protected connectAsync(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const endpoint = 'expo-dev-plugins/broadcast';
      const ws = new WebSocketWithReconnect(`ws://${this.connectionInfo.devServer}/${endpoint}`, {
        binaryType: this.options?.websocketBinaryType,
        onError: (e: unknown) => {
          if (e instanceof Error) {
            console.warn(`Error happened from the WebSocket connection: ${e.message}\n${e.stack}`);
          } else {
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
      ws.addEventListener('close', (e: WebSocketCloseEvent) => {
        logger.info('WebSocket closed', e.code, e.reason);
      });
    });
  }

  protected handleMessage = (event: WebSocketMessageEvent) => {
    this.handleMessageImpl(event);
  };

  private handleMessageImpl = async (event: WebSocketMessageEvent) => {
    let buffer: ArrayBuffer;
    if (event.data instanceof ArrayBuffer) {
      buffer = event.data;
    } else if (ArrayBuffer.isView(event.data)) {
      buffer = event.data.buffer;
    } else if (event.data instanceof Blob) {
      buffer = await blobToArrayBufferAsync(event.data);
    } else {
      logger.warn('Unsupported received data type in handleMessageImpl');
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
  public getWebSocketBackingStore(): WebSocketBackingStore {
    return this.wsStore;
  }
}
