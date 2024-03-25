import { DevToolsPluginClient } from './DevToolsPluginClient';
import type { HandshakeMessageParams } from './devtools.types';
import * as logger from './logger';

/**
 * The DevToolsPluginClient for the app -> browser communication.
 */
export class DevToolsPluginClientImplApp extends DevToolsPluginClient {
  // Map of pluginName -> browserClientId
  private browserClientMap: Record<string, string> = {};

  /**
   * Initialize the connection.
   * @hidden
   */
  override async initAsync(): Promise<void> {
    await super.initAsync();
    this.addHandshakeHandler();
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
