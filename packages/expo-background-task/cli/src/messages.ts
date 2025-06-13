import { WebSocket } from 'ws';
import type { Data } from 'ws';

import { DevtoolsApp } from './types';

export class SendMessageError extends Error {
  constructor(
    message: string,
    public app: DevtoolsApp
  ) {
    super(message);
  }
}

const getDeviceIdentifier = (app: DevtoolsApp) => {
  // Use the deviceName + app ID as the device identifier
  return formatDeviceIdentifier(app.deviceName, app.appId);
};

const formatDeviceIdentifier = (deviceName: string, applicationId: string) => {
  // Use the deviceName + app ID as the device identifier
  return `${deviceName} (${applicationId})`;
};

/**
 * Sends out a message to the WebSocket server using a broadcast channel.
 * This function connects to the WebSocket server, sends a message, and waits for a response.
 * If the connection times out or an error occurs, it rejects the promise with an error.
 * @param message Message to send to the WebSocket server.
 * @param apps Apps to send the message to. This is an array of `MetroInspectorApp` objects.
 */
export async function sendMessageAsync(message: string, apps: DevtoolsApp[], timeoutMs = 10_000) {
  // Sanity check: ensure that all apps share the same WebSocket URL
  if (apps.length === 0) {
    return Promise.reject(
      new SendMessageError('No apps provided to send the message to.', apps[0])
    );
  }
  // Check that all apps share the same broadcast URL
  if (
    apps.some(
      (app) => new URL(app.webSocketDebuggerUrl).host !== new URL(apps[0].webSocketDebuggerUrl).host
    )
  ) {
    return Promise.reject(
      new SendMessageError(
        'All apps must share the same WebSocket URL to send messages.' +
          apps[0].webSocketDebuggerUrl,
        apps[0]
      )
    );
  }
  // Create connection
  const url = new URL(apps[0].webSocketDebuggerUrl);
  const address = `ws://${url.host}/expo-dev-plugins/broadcast`;
  const pluginName = 'expo-backgroundtask-devtools-plugin';

  // Create results for all apps
  const results = apps.reduce(
    (acc, app) => ({
      ...acc,
      [app.id]: null,
    }),
    {} as Record<string, string | null>
  );

  // Create a websocket connection to the broadcast channel
  const ws = new WebSocket(address);

  // Lets do the rest of the handling in the event listeners through a promise that will be resolved
  // when we get a response for the message we sent
  return new Promise<{ id: string; result: string }[]>((resolve, reject) => {
    // Setup timeout handler
    const timeoutHandler = setTimeout(() => {
      // Check if any results are still not resolved - and then
      // we'll just reject those promises with a timeout error
      if (!Object.values(results).every((result) => result !== null)) {
        const errorMessage = `Timeout while waiting for response.`;
        reject(new SendMessageError(errorMessage, apps[0]));
      }
      // Clear the timeout handler
      clearTimeout(timeoutHandler);
    }, timeoutMs);

    ws.addEventListener('message', ({ data }: { data: Data }) => {
      const parsedData = parseWebSocketData(data);
      const { messageKey, payload } = parsedData;

      if (messageKey.pluginName === pluginName && messageKey.method === message + '_response') {
        // We got a response for our message. Now get the app ID and result
        const { deviceName, applicationId } = payload;
        const result = payload.message;
        const app = apps.find(
          (app) => getDeviceIdentifier(app) === formatDeviceIdentifier(deviceName, applicationId)
        );
        if (!app) {
          reject(
            new Error(
              `Received response for unknown app: ${deviceName} (${applicationId}). Ignoring.`
            )
          );
          return;
        }
        results[app.id] = result.toString();

        // Check if we have results for all apps
        if (Object.values(results).every((result) => result !== null)) {
          clearTimeout(timeoutHandler);
          ws.close();
          // Resolve the promise with the results
          resolve(
            Object.keys(results).map((key) => ({
              id: key,
              result: results[key]!,
            }))
          );
        }
      }
    });

    ws.addEventListener('open', () => {
      // On Open we'll send the message to the broadcast channel
      const messageKey = getMessageKey(pluginName, message);
      ws.send(JSON.stringify({ messageKey, payload: { from: 'cli' } }));
    });
    ws.addEventListener('error', () => {
      clearTimeout(timeoutHandler);
      console.error(`Failed to connect to the WebSocket server at ${url}`);
      reject(new Error(`Failed to connect to the WebSocket server at ${url}`));
    });
    ws.addEventListener('close', () => {
      //console.debug('WebSocket connection closed');
      clearTimeout(timeoutHandler);
      reject(new Error('WebSocket connection closed unexpectedly'));
    });
  });
}

const getMessageKey = (pluginName: string, method: string) => ({
  pluginName,
  method,
});

function parseWebSocketData<T extends Record<string, any>>(data: Data): any {
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
