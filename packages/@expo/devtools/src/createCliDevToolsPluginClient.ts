import type { ExpoCliExtensionAppInfo } from './CliExtension.types.js';
import type { DevToolsPluginClient } from './DevToolsPluginClient.js';
import { createDevToolsPluginClient } from './DevToolsPluginClientFactory.js';
import { PROTOCOL_VERSION } from './ProtocolVersion.js';
import type { DevToolsPluginClientOptions } from './devtools.types.js';

/**
 * Creates a `DevToolsPluginClient` for use in CLI extension processes.
 *
 * Unlike `getDevToolsPluginClientAsync`, this bypasses the instance cache —
 * correct for one-shot CLI processes that should each get their own connection.
 */
export async function createCliDevToolsPluginClient(
  pluginName: string,
  app: ExpoCliExtensionAppInfo,
  options?: DevToolsPluginClientOptions
): Promise<DevToolsPluginClient> {
  const url = new URL(app.webSocketDebuggerUrl);
  return createDevToolsPluginClient(
    {
      sender: 'browser',
      devServer: url.host,
      pluginName,
      protocolVersion: PROTOCOL_VERSION,
      useWss: url.protocol === 'wss:',
    },
    options
  );
}
