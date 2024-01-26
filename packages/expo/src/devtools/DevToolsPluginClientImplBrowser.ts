import {
  DevToolsPluginClient,
  DevToolsPluginMethod,
  MESSAGE_PROTOCOL_VERSION,
} from './DevToolsPluginClient';
import * as logger from './logger';

/**
 * The DevToolsPluginClient for the browser -> app communication.
 */
export class DevToolsPluginClientImplBrowser extends DevToolsPluginClient {
  private ws: WebSocket | null = null;
  private browserClientId: string = Date.now().toString();

  /**
   * Initialize the connection.
   * @hidden
   */
  override async initAsync(): Promise<void> {
    if (this.ws == null) {
      const ws = await this.connectAsync();
      this.ws = ws;
    }
    this.ws.addEventListener('message', this.handleMessage);
    this.startHandshake();
  }

  /**
   * Close the connection.
   */
  override async closeAsync(): Promise<void> {
    this.ws?.removeEventListener('message', this.handleMessage);
    this.ws?.close();
    this.ws = null;
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Send a message to the other end of DevTools.
   * @param method A method name.
   * @param params any extra payload.
   */
  override sendMessage(method: string, params: any, pluginNamespace?: string): void {
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
    this.ws?.send(JSON.stringify(payload));
  }

  /**
   * Returns whether the client is connected to the server.
   */
  override isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private startHandshake() {
    this.addMessageListener('terminateBrowserClient', (params) => {
      if (this.browserClientId !== params.browserClientId) {
        return;
      }
      logger.info('Received terminateBrowserClient messages and terminate the current connection');
      this.closeAsync();
    });
    this.sendMessage('handshake', {
      browserClientId: this.browserClientId,
      pluginName: this.connectionInfo.pluginName,
    });
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
        this.ws = null;
      });
    });
  }
}
