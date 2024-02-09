import {
  DevToolsPluginClient,
  DevToolsPluginMethod,
  MESSAGE_PROTOCOL_VERSION,
} from './DevToolsPluginClient';
import type { HandshakeMessageParams } from './devtools.types';
import * as logger from './logger';

/**
 * The DevToolsPluginClient for the app -> browser communication.
 */
export class DevToolsPluginClientImplApp extends DevToolsPluginClient {
  // Map of pluginName -> browserClientId
  private browserClientMap: Record<string, string> = {};

  private static ws: WebSocket | null = null;
  private static refCount: number = 0;

  /**
   * Initialize the connection.
   * @hidden
   */
  override async initAsync(): Promise<void> {
    if (DevToolsPluginClientImplApp.ws == null) {
      DevToolsPluginClientImplApp.ws = await this.connectAsync();
    }
    DevToolsPluginClientImplApp.refCount += 1;
    DevToolsPluginClientImplApp.ws.addEventListener('message', this.handleMessage);
    this.addHandshakeHandler();
  }

  /**
   * Close the connection.
   */
  override async closeAsync(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    DevToolsPluginClientImplApp.ws?.removeEventListener('message', this.handleMessage);
    DevToolsPluginClientImplApp.refCount -= 1;
    if (DevToolsPluginClientImplApp.refCount < 1) {
      DevToolsPluginClientImplApp.ws?.close();
      DevToolsPluginClientImplApp.ws = null;
    }
  }

  /**
   * Send a message to the other end of DevTools.
   * @param method A method name.
   * @param params any extra payload.
   */
  override sendMessage(method: string, params: any): void {
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
    DevToolsPluginClientImplApp.ws?.send(JSON.stringify(payload));
  }

  /**
   * Returns whether the client is connected to the server.
   */
  override isConnected(): boolean {
    return DevToolsPluginClientImplApp.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get the WebSocket instance. Exposed for testing.
   * @hidden
   */
  public static getWebSocket(): WebSocket | null {
    return DevToolsPluginClientImplApp.ws;
  }

  /**
   * Get the current reference count. Exposed for testing.
   * @hidden
   */
  public static getRefCount(): number {
    return DevToolsPluginClientImplApp.refCount;
  }

  private async connectAsync(): Promise<WebSocket> {
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
        DevToolsPluginClientImplApp.ws = null;
      });
    });
  }

  private addHandshakeHandler() {
    this.addMessageListener('handshake', (params: HandshakeMessageParams) => {
      const previousBrowserClientId = this.browserClientMap[params.pluginName];
      if (previousBrowserClientId != null && previousBrowserClientId !== params.browserClientId) {
        logger.info(
          `Terminate the previous browser client connection - previousBrowserClientId[${previousBrowserClientId}]`
        );
        this.sendMessage('terminateBrowserClient', { browserClientId: previousBrowserClientId });
      }
      this.browserClientMap[params.pluginName] = params.browserClientId;
    });
  }
}
