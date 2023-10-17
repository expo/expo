import type { DevToolsPluginClient } from './DevToolsPluginClient';
import { DevToolsPluginClientImplApp } from './DevToolsPluginClientImplApp';
import { DevToolsPluginClientImplBrowser } from './DevToolsPluginClientImplBrowser';
import type { ConnectionInfo } from './devtools.types';

/**
 * Factory of DevToolsPluginClient based on sender types.
 * @hidden
 */
export async function createDevToolsPluginClient(
  connectionInfo: ConnectionInfo
): Promise<DevToolsPluginClient> {
  let client: DevToolsPluginClient;
  if (connectionInfo.sender === 'app') {
    client = new DevToolsPluginClientImplApp(connectionInfo);
  } else {
    client = new DevToolsPluginClientImplBrowser(connectionInfo);
  }
  await client.initAsync();
  return client;
}
