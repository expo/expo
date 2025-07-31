import { DevToolsPluginClient } from './DevToolsPluginClient';
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
    this.addHandskakeMessageListener((params) => {
      if (params.method === 'handshake') {
        const { pluginName, protocolVersion } = params;

        // [0] Check protocol version
        if (protocolVersion !== this.connectionInfo.protocolVersion) {
          // Use console.warn than logger because we want to show the warning even logging is disabled.
          console.warn(
            `Received an incompatible devtools plugin handshake message - pluginName[${pluginName}]`
          );
          this.terminateBrowserClient(pluginName, params.browserClientId);
          return;
        }

        // [1] Terminate duplicated browser clients for the same plugin
        const previousBrowserClientId = this.browserClientMap[pluginName];
        if (previousBrowserClientId != null && previousBrowserClientId !== params.browserClientId) {
          logger.info(
            `Terminate the previous browser client connection - previousBrowserClientId[${previousBrowserClientId}]`
          );
          this.terminateBrowserClient(pluginName, previousBrowserClientId);
        }
        this.browserClientMap[pluginName] = params.browserClientId;
      }
    });
  }

  private terminateBrowserClient(pluginName: string, browserClientId: string) {
    this.sendHandshakeMessage({
      protocolVersion: this.connectionInfo.protocolVersion,
      method: 'terminateBrowserClient',
      browserClientId,
      pluginName,
    });
  }
}
