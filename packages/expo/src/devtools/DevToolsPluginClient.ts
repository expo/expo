import { EventEmitter, EventSubscription } from 'fbemitter';

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

  public constructor(public readonly connectionInfo: ConnectionInfo) {}

  /**
   * Initialize the connection.
   * @hidden
   */
  public abstract initAsync(): Promise<void>;

  /**
   * Close the connection.
   */
  public abstract closeAsync(): Promise<void>;

  /**
   * Send a message to the other end of DevTools.
   * @param method A method name.
   * @param params any extra payload.
   */
  public abstract sendMessage(method: string, params: any): void;

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
  public abstract isConnected(): boolean;

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
}
