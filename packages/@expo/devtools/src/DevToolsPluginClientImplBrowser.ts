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
    this.addHandskakeMessageListener((params) => {
      if (
        params.method === 'terminateBrowserClient' &&
        this.browserClientId === params.browserClientId
      ) {
        logger.info(
          'Received terminateBrowserClient messages and terminate the current connection'
        );
        this.closeAsync();
      }
    });
    this.sendHandshakeMessage({
      protocolVersion: this.connectionInfo.protocolVersion,
      pluginName: this.connectionInfo.pluginName,
      method: 'handshake',
      browserClientId: this.browserClientId,
    });
  }
}
