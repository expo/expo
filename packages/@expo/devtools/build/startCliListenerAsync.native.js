import * as Application from 'expo-application';
import * as DeviceInfo from 'expo-device';
import { Platform } from 'expo-modules-core';
import { getDevToolsPluginClientAsync } from './DevToolsPluginClientFactory';
/**
 * Starts a new imperative listener for cli plugins. This is an alternative to the useDevToolsPlugin
 * hook that is used with devtools. This function is used to avoid having the user to use the hook,
 * and to be able to imperatively communicate over the web socket connections with running apps.
 * We should not run these if we are in production - but we should run in development
 * and when in a development client built in release mode with EAS.
 * @returns
 */
export const startCliListenerAsync = async (pluginName) => {
    // Only include this code if we are in a development environment.
    if (process.env.NODE_ENV !== 'production') {
        console.debug(`[startCliListenerAsync] Starting CLI message listener for plugin ${pluginName}...`);
        let clientRef = null;
        const listenerRemovals = [];
        const getDeviceName = () => {
            return Platform.OS === 'android'
                ? DeviceInfo.deviceName +
                    ' - ' +
                    DeviceInfo.osVersion +
                    ' - API ' +
                    DeviceInfo.platformApiLevel
                : DeviceInfo.deviceName;
        };
        const client = await getDevToolsPluginClientAsync(pluginName);
        if (clientRef != null) {
            // Clean up the previous client if it exists
            listenerRemovals.forEach((remove) => remove());
            listenerRemovals.length = 0;
        }
        clientRef = client;
        // Ensure the module is properly cleaned up on hot reloads
        const m = module;
        if ('hot' in m && m.hot) {
            const hot = m.hot;
            if ('dispose' in hot && hot.dispose && hot.dispose instanceof Function) {
                hot.dispose(() => {
                    listenerRemovals.forEach((remove) => remove());
                    listenerRemovals.length = 0;
                });
            }
        }
        // Create the addMessageListener function for the plugin
        const addMessageListener = (eventName, callback) => {
            listenerRemovals.push(client.addMessageListener(eventName, async (params) => {
                // Create response message function
                const sendResponseAsync = async (message) => {
                    await sendMessageAsync(eventName + '_response', message);
                };
                callback({ params, sendResponseAsync });
            }).remove);
        };
        // Create the sendMessageAsync function for the plugin
        const sendMessageAsync = async (eventName, message) => {
            await client.sendMessage(eventName, {
                message,
                deviceName: getDeviceName(),
                applicationId: Application.applicationId,
            });
        };
        return { addMessageListener, sendMessageAsync };
    }
    else {
        console.debug(`Skipping starting startDevToolsPluginListenerAsync for plugin ${pluginName}...`);
        const addMessageListener = (_e, _c) => { };
        // Create the sendMessageAsync function for the plugin
        const sendMessageAsync = async (_e, _m) => { };
        return { addMessageListener, sendMessageAsync };
    }
};
//# sourceMappingURL=startCliListenerAsync.native.js.map