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
export const startCliListenerAsync = async (pluginName: string) => {
  // Only include this code if we are in a development environment.
  if (process.env.NODE_ENV !== 'production') {
    console.debug(
      `[startCliListenerAsync] Starting CLI message listener for plugin ${pluginName}...`
    );
    let clientRef: Awaited<ReturnType<typeof getDevToolsPluginClientAsync>> | null = null;
    const listenerRemovals: (() => void)[] = [];

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
      const hot = m.hot as object;
      if ('dispose' in hot && hot.dispose && hot.dispose instanceof Function) {
        hot.dispose(() => {
          listenerRemovals.forEach((remove) => remove());
          listenerRemovals.length = 0;
        });
      }
    }

    // Create the addMessageListener function for the plugin
    const addMessageListener = <P extends Record<string, string>>(
      eventName: string,
      callback: (arg: { params: P; sendResponseAsync: (message: string) => Promise<void> }) => void
    ) => {
      listenerRemovals.push(
        client.addMessageListener(eventName, async (params) => {
          // Create response message function
          const sendResponseAsync = async (message: string) => {
            await sendMessageAsync(eventName + '_response', message);
          };
          callback({ params, sendResponseAsync });
        }).remove
      );
    };

    // Create the sendMessageAsync function for the plugin
    const sendMessageAsync = async (eventName: string, message: string) => {
      await client.sendMessage(eventName, {
        message,
        deviceName: getDeviceName(),
        applicationId: Application.applicationId,
      });
    };

    return { addMessageListener, sendMessageAsync };
  } else {
    console.debug(`Skipping starting startDevToolsPluginListenerAsync for plugin ${pluginName}...`);
    const addMessageListener = <P extends Record<string, string>>(
      _e: string,
      _c: (arg: { params: P; sendResponseAsync: (message: string) => Promise<void> }) => void
    ) => {};

    // Create the sendMessageAsync function for the plugin
    const sendMessageAsync = async (_e: string, _m: string) => {};
    return { addMessageListener, sendMessageAsync };
  }
};
