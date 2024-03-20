import { DevToolsPluginClient } from './DevToolsPluginClient';
import * as logger from './logger';

/**
 * The DevToolsPluginClient for the browser -> app communication.
 */
export class DevToolsPluginClientImplBrowser extends DevToolsPluginClient {
  private browserClientId: string = Date.now().toString();

  /**
   * Initialize the connection.
   * @hidden
   */
  override async initAsync(): Promise<void> {
    await super.initAsync();
    this.startHandshake();
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
}
