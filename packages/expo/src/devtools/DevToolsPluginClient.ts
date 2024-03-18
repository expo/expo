import { EventEmitter, EventSubscription } from 'fbemitter';

import { WebSocketBackingStore } from './WebSocketBackingStore';
import type { ConnectionInfo } from './devtools.types';
import * as logger from './logger';

// This version should be synced with the one in the **createMessageSocketEndpoint.ts** in @react-native-community/cli-server-api
export const MESSAGE_PROTOCOL_VERSION = 2;

export const DevToolsPluginMethod = 'Expo:DevToolsPlugin';

/**
 * This client is for the Expo DevTools Plugins to communicate between the app and the DevTools webpage hosted in a browser.
 * All the code should be both compatible with browsers and React Native.
 */
export abstract class DevToolsPluginClient {
  protected eventEmitter: EventEmitter = new EventEmitter();

  private static defaultWSStore: WebSocketBackingStore = new WebSocketBackingStore();
  private readonly wsStore: WebSocketBackingStore = DevToolsPluginClient.defaultWSStore;

  public constructor(public readonly connectionInfo: ConnectionInfo) {
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
    if (!this.isConnected()) {
      throw new Error('Unable to send message in a disconnected state.');
    }

    const payload: Record<string, any> = {
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
      const ws = new WebSocket(`ws://${this.connectionInfo.devServer}/message`);
      ws.addEventListener('open', () => {
        resolve(ws);
      });
      ws.addEventListener('error', (e) => {
        reject(e);
      });
      ws.addEventListener('close', (e: WebSocketCloseEvent) => {
        logger.info('WebSocket closed', e.code, e.reason);
        this.wsStore.ws = null;
      });
    });
  }

  protected handleMessage = (event: WebSocketMessageEvent): void => {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch (e) {
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
  public getWebSocketBackingStore(): WebSocketBackingStore {
    return this.wsStore;
  }
}
