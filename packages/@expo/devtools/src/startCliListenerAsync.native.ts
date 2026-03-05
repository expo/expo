import type { CliRequestPayload, CliResponsePayload } from './CliExtension.types.js';
import { getDevToolsPluginClientAsync } from './DevToolsPluginClientFactory.js';

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

    const client = await getDevToolsPluginClientAsync(pluginName);
    if (clientRef != null) {
      listenerRemovals.forEach((remove) => remove());
      listenerRemovals.length = 0;
    }
    clientRef = client;

    // Ensure the module is properly cleaned up on hot reloads
    // This is internal metro functionality, but we need to use it to be able to avoid the need for
    // the user to use a specific hook to be able to use this functionality in their apps.
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
    const addMessageListener = <P extends Record<string, unknown>>(
      eventName: string,
      callback: (arg: { params: P; sendResponseAsync: (message: string) => Promise<void> }) => void
    ) => {
      listenerRemovals.push(
        client.addMessageListener(eventName, async (requestPayload: CliRequestPayload<P>) => {
          const { targetDeviceName, targetAppId } = requestPayload;

          const sendResponseAsync = async (message: string) => {
            const response: CliResponsePayload = {
              message,
              deviceName: targetDeviceName,
              applicationId: targetAppId,
            };
            await client.sendMessage(eventName + '_response', response);
          };
          callback({ params: requestPayload.params as P, sendResponseAsync });
        }).remove
      );
    };

    return { addMessageListener };
  } else {
    console.debug(`Skipping starting startDevToolsPluginListenerAsync for plugin ${pluginName}...`);
    const addMessageListener = <P extends Record<string, unknown>>(
      _e: string,
      _c: (arg: { params: P; sendResponseAsync: (message: string) => Promise<void> }) => void
    ) => {};

    return { addMessageListener };
  }
};
