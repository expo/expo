import { Data } from 'ws';

import {
  CliMessageEnvelope,
  CliRequestPayload,
  ExpoCliExtensionAppInfo,
} from './CliExtension.types.js';
import { SendMessageError } from './CliExtensionUtils.js';

// We'd like this to be fairly quick, and at least a bit shorter
// than Metro's own timeout (10 seconds) to be able to report errors before Metro does.
const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * Sends out a message to the WebSocket server using a broadcast channel and waits for a response.
 * If the connection times out or an error occurs, it rejects the promise with an error.
 * @param message Message to send to the WebSocket server.
 * @param pluginName Name of the plugin to send the message to. This is used to identify the plugin in the WebSocket server.
 * @param app App to send the message to. This is a `MetroInspectorApp` object.
 * @param params Optional parameters to include in the message payload.
 * @param timeoutMs Timeout in milliseconds to wait for a response. Defaults to 10 seconds.
 */
export async function sendCliMessageAsync<Params extends Record<string, unknown>>(
  message: string,
  pluginName: string,
  app: ExpoCliExtensionAppInfo,
  params?: Params,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<string | null> {
  // Sanity check: ensure that all apps share the same WebSocket URL
  if (!app) {
    return Promise.reject(new Error('No app provided to send the message to.'));
  }

  // Create connection
  const url = new URL(app.webSocketDebuggerUrl);
  const address = `ws://${url.host}/expo-dev-plugins/broadcast`;

  // Create results for all apps
  let results: string | null;

  // Create a websocket connection to the broadcast channel
  const ws = new WebSocket(address);

  // Lets do the rest of the handling in the event listeners through a promise that will be resolved
  // when we get a response for the message we sent
  return new Promise<string | null>((resolve, reject) => {
    // Setup timeout handler
    const timeoutHandler = setTimeout(() => {
      // Close the WebSocket to allow the process to exit
      ws.close();
      reject(new SendMessageError(`Timeout while waiting for response from app.`, app));
      clearTimeout(timeoutHandler);
    }, timeoutMs);

    ws.addEventListener('message', ({ data }: { data: Data }) => {
      const parsedData = parseWebSocketData(data);
      const { messageKey, payload } = parsedData;
      if (messageKey.pluginName === pluginName && messageKey.method === message + '_response') {
        // We got a response for our message. Now get the app ID and result
        const { deviceName, applicationId } = payload;
        const result = payload.message;
        if (app.deviceName !== deviceName || app.appId !== applicationId) {
          clearTimeout(timeoutHandler);
          ws.close();
          reject(new Error(`Received response for unknown app: ${deviceName} (${applicationId})`));
          return;
        }

        results = result.toString();

        // Check if we have results for all apps
        clearTimeout(timeoutHandler);
        ws.close();
        // Resolve the promise with the results
        resolve(results);
      }
    });

    ws.addEventListener('open', () => {
      // On Open we'll send the message to the broadcast channel
      const messageKey = getMessageKey(pluginName, message);
      const envelope: CliMessageEnvelope<CliRequestPayload<Params>> = {
        messageKey,
        payload: {
          from: 'cli',
          targetDeviceName: app.deviceName,
          targetAppId: app.appId,
          params,
        },
      };
      ws.send(JSON.stringify(envelope));
    });
    ws.addEventListener('error', () => {
      clearTimeout(timeoutHandler);
      ws.close();
      console.error(`Failed to connect to the WebSocket server at ${url}`);
      reject(new Error(`Failed to connect to the WebSocket server at ${url}`));
    });
    ws.addEventListener('close', () => {
      clearTimeout(timeoutHandler);
    });
  });
}

const getMessageKey = (pluginName: string, method: string) => ({
  pluginName,
  method,
});

function parseWebSocketData<T extends Record<string, any>>(data: Data): T {
  if (typeof data === 'string') {
    return JSON.parse(data) as T;
  } else if (data instanceof Buffer) {
    return JSON.parse(data.toString()) as T;
  } else if (data instanceof ArrayBuffer) {
    return JSON.parse(Buffer.from(data).toString()) as T;
  } else if (Array.isArray(data)) {
    return JSON.parse(Buffer.concat(data).toString()) as T;
  }
  throw new Error('Unsupported WebSocket data type');
}
