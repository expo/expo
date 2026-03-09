import { getDevToolsPluginClientAsync } from './DevToolsPluginClientFactory.js';
/**
 * Starts a new imperative listener for cli plugins. This is an alternative to the useDevToolsPlugin
 * hook that is used with devtools. This function is used to avoid having the user to use the hook,
 * and to be able to imperatively communicate over the web socket connections with running apps.
 * We should not run these if we are in production.
 *
 * Returns an object with:
 * - `addMessageListener` — register a handler for a named CLI message
 *
 * Cleanup is handled automatically: previous listeners and clients are torn down when
 * `startCliListenerAsync` is called again with the same plugin name (e.g. on caller
 * hot reload), and when this module itself is hot-reloaded.
 */
export const startCliListenerAsync = async (pluginName) => {
    // Only include this code if we are in a development environment.
    if (process.env.NODE_ENV !== 'production') {
        console.debug(`[startCliListenerAsync] Starting CLI message listener for plugin ${pluginName}...`);
        const pluginInfo = getPluginInfo(pluginName);
        pluginInfo.disposeFns.forEach((fn) => fn());
        pluginInfo.disposeFns = [];
        const client = await getDevToolsPluginClientAsync(pluginName);
        pluginInfo.disposeFns.push(() => {
            client.closeAsync();
        });
        // Create the addMessageListener function for the plugin
        const addMessageListener = (eventName, callback) => {
            pluginInfo.disposeFns.push(client.addMessageListener(eventName, async (requestPayload) => {
                const { targetDeviceName, targetAppId, messageId } = requestPayload;
                const sendResponseAsync = async (message) => {
                    const response = {
                        message,
                        messageId,
                        deviceName: targetDeviceName,
                        applicationId: targetAppId,
                    };
                    await client.sendMessage(eventName + '_response', response);
                };
                callback({ params: requestPayload.params, sendResponseAsync });
            }).remove);
        };
        return { addMessageListener };
    }
    else {
        console.debug(`Skipping starting startDevToolsPluginListenerAsync for plugin ${pluginName}...`);
        const addMessageListener = (_e, _c) => { };
        return { addMessageListener };
    }
};
const GlobalKey = '__expo_devtools_cli_plugin_clients__';
/**
 * We use globalThis to store plugin info and clients because we want to be able to clean up old
 * clients and listeners when this module is hot reloaded, or when startCliListenerAsync is called
 * multiple times with the same plugin name (e.g. on caller hot reload). This allows us to avoid
 * memory leaks and duplicate listeners in development.
 * NOTE: When doing a full reload or quitting the app, the global state will be cleared, so we don't
 * need to worry about that case.
 */
const getPluginInfo = (pluginName) => {
    if (!globalThis[GlobalKey]) {
        globalThis[GlobalKey] = new Map();
    }
    const globalPluginInfoMap = globalThis[GlobalKey];
    if (!globalPluginInfoMap.has(pluginName)) {
        globalPluginInfoMap.set(pluginName, { disposeFns: [] });
    }
    return globalPluginInfoMap.get(pluginName);
};
//# sourceMappingURL=startCliListenerAsync.native.js.map