import { useState, useEffect } from 'react';

import { DevToolsPluginClient } from './DevToolsPluginClient';
import { createDevToolsPluginClient } from './DevToolsPluginClientFactory';
import { getConnectionInfo } from './getConnectionInfo';

const instanceMap: Record<string, DevToolsPluginClient> = {};

/**
 * Public API to get the DevToolsPluginClient instance.
 */
export async function getDevToolsPluginClientAsync(
  pluginName: string
): Promise<DevToolsPluginClient> {
  const connectionInfo = getConnectionInfo();
  let instance = instanceMap[pluginName];
  if (
    instance != null &&
    (instance.isConnected() === false ||
      instance.connectionInfo.devServer !== connectionInfo.devServer)
  ) {
    await instance.closeAsync();
    delete instanceMap[pluginName];
  }
  if (instance == null) {
    instance = await createDevToolsPluginClient({ ...connectionInfo, pluginName });
    instanceMap[pluginName] = instance;
  }
  return instance;
}

/**
 * A React hook to get the DevToolsPluginClient instance.
 */
export function useDevToolsPluginClient(pluginName: string): DevToolsPluginClient | null {
  const [client, setClient] = useState<DevToolsPluginClient | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const client = await getDevToolsPluginClientAsync(pluginName);
        setClient(client);
      } catch (e) {
        setError(new Error('Failed to setup client from useDevToolsPluginClient: ' + e.toString()));
      }
    }

    async function teardown() {
      try {
        await client?.closeAsync();
      } catch (e) {
        setError(
          new Error('Failed to teardown client from useDevToolsPluginClient: ' + e.toString())
        );
      }
    }

    setup();
    return () => {
      teardown();
    };
  }, [pluginName]);

  if (error != null) {
    throw error;
  }
  return client;
}
