import { DevToolsPluginClient } from './DevToolsPluginClient';
import type { HandshakeMessageParams } from './devtools.types';
import * as logger from './logger';

interface BrowserClientMetadata {
  browserClientId: string;
  useLegacyTransport?: boolean;
}

/**
 * The DevToolsPluginClient for the app -> browser communication.
 */
export class DevToolsPluginClientImplApp extends DevToolsPluginClient {
  private browserClientMap: Record<string, BrowserClientMetadata> = {};

  /**
   * Initialize the connection.
   * @hidden
   */
  override async initAsync(): Promise<void> {
    await super.initAsync();
    this.addHandshakeHandler();
  }

  override sendMessage(method: string, params: any) {
    const pluginName = this.connectionInfo.pluginName;
    const useLegacyTransport = this.browserClientMap[pluginName]?.useLegacyTransport ?? false;
    if (useLegacyTransport) {
      this.sendMessageLegacy(method, params);
    } else {
      super.sendMessage(method, params);
    }
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
        const previousBrowserClientMetadata = this.browserClientMap[pluginName];
        const previousBrowserClientId = previousBrowserClientMetadata?.browserClientId;
        if (previousBrowserClientId != null && previousBrowserClientId !== params.browserClientId) {
          logger.info(
            `Terminate the previous browser client connection - previousBrowserClientId[${previousBrowserClientId}]`
          );
          this.terminateBrowserClient(pluginName, previousBrowserClientId);
        }
        this.browserClientMap[pluginName] = {
          browserClientId: params.browserClientId,
        };
      }
    });

    // backward compatible handshaking
    this.addMessageListener('handshake', (params: HandshakeMessageParams) => {
      console.warn(`Received a legacy plugin handshake message - pluginName[${params.pluginName}]`);
      const { pluginName } = params;
      const previousBrowserClientMetadata = this.browserClientMap[pluginName];
      const previousBrowserClientId = previousBrowserClientMetadata?.browserClientId;
      if (previousBrowserClientId != null && previousBrowserClientId !== params.browserClientId) {
        logger.info(
          `Terminate the previous browser client connection - previousBrowserClientId[${previousBrowserClientId}]`
        );
        this.sendMessage('terminateBrowserClient', { browserClientId: previousBrowserClientId });
      }
      this.browserClientMap[pluginName] = {
        browserClientId: params.browserClientId,
        useLegacyTransport: true,
      };
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
