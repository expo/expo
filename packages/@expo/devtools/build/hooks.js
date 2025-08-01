import { useState, useEffect } from 'react';
import { getDevToolsPluginClientAsync } from './DevToolsPluginClientFactory';
/**
 * A React hook to get the DevToolsPluginClient instance.
 */
export function useDevToolsPluginClient(pluginName, options) {
    const [client, setClient] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function setup() {
            try {
                const client = await getDevToolsPluginClientAsync(pluginName, options);
                setClient(client);
            }
            catch (e) {
                setError(new Error('Failed to setup client from useDevToolsPluginClient: ' + e.toString()));
            }
        }
        async function teardown() {
            try {
                await client?.closeAsync();
            }
            catch (e) {
                setError(new Error('Failed to teardown client from useDevToolsPluginClient: ' + e.toString()));
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
//# sourceMappingURL=hooks.js.map