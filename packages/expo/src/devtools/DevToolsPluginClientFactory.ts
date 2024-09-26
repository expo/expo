import type { DevToolsPluginClient } from './DevToolsPluginClient';
import { DevToolsPluginClientImplApp } from './DevToolsPluginClientImplApp';
import { DevToolsPluginClientImplBrowser } from './DevToolsPluginClientImplBrowser';
import type { ConnectionInfo, DevToolsPluginClientOptions } from './devtools.types';
import { getConnectionInfo } from './getConnectionInfo';

const instanceMap: Record<string, DevToolsPluginClient | Promise<DevToolsPluginClient>> = {};

/**
 * Factory of DevToolsPluginClient based on sender types.
 * @hidden
 */
export async function createDevToolsPluginClient(
  connectionInfo: ConnectionInfo,
  options?: DevToolsPluginClientOptions
): Promise<DevToolsPluginClient> {
  let client: DevToolsPluginClient;
  if (connectionInfo.sender === 'app') {
    client = new DevToolsPluginClientImplApp(connectionInfo, options);
  } else {
    client = new DevToolsPluginClientImplBrowser(connectionInfo, options);
  }
  await client.initAsync();
  return client;
}

/**
 * Public API to get the DevToolsPluginClient instance.
 */
export async function getDevToolsPluginClientAsync(
  pluginName: string,
  options?: DevToolsPluginClientOptions
): Promise<DevToolsPluginClient> {
  const connectionInfo = getConnectionInfo();

  let instance: DevToolsPluginClient | Promise<DevToolsPluginClient> | null =
    instanceMap[pluginName];
  if (instance != null) {
    if (instance instanceof Promise) {
      return instance;
    }
    if (
      instance.isConnected() === false ||
      instance.connectionInfo.devServer !== connectionInfo.devServer
    ) {
      await instance.closeAsync();
      delete instanceMap[pluginName];
      instance = null;
    }
  }
  if (instance == null) {
    const instancePromise = createDevToolsPluginClient({ ...connectionInfo, pluginName }, options);
    instanceMap[pluginName] = instancePromise;
    instance = await instancePromise;
    instanceMap[pluginName] = instance;
  }
  return instance;
}

/**
 * Internal testing API to cleanup all DevToolsPluginClient instances.
 */
export function cleanupDevToolsPluginInstances() {
  for (const pluginName of Object.keys(instanceMap)) {
    const instance = instanceMap[pluginName];
    delete instanceMap[pluginName];
    if (instance instanceof Promise) {
      instance.then((instance) => instance.closeAsync());
    } else {
      instance.closeAsync();
    }
  }
}
