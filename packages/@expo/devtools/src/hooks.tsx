import { useState, useEffect } from 'react';

import { DevToolsPluginClient } from './DevToolsPluginClient';
import { getDevToolsPluginClientAsync } from './DevToolsPluginClientFactory';
import type { DevToolsPluginClientOptions } from './devtools.types';

/**
 * A React hook to get the DevToolsPluginClient instance.
 */
export function useDevToolsPluginClient(
  pluginName: string,
  options?: DevToolsPluginClientOptions
): DevToolsPluginClient | null {
  const [client, setClient] = useState<DevToolsPluginClient | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const client = await getDevToolsPluginClientAsync(pluginName, options);
        setClient(client);
      } catch (e: any) {
        setError(new Error('Failed to setup client from useDevToolsPluginClient: ' + e.toString()));
      }
    }

    async function teardown() {
      try {
        await client?.closeAsync();
      } catch (e: any) {
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
