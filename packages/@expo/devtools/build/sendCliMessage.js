import { SendMessageError } from './CliExtensionUtils.js';
// We'd like this to be fairly quick, and at least a bit shorter
// than Metro's own timeout (10 seconds) to be able to report errors before Metro does.
const DEFAULT_TIMEOUT_MS = 5_000;
/**
 * Sends out a message to the WebSocket server using a broadcast channel and waits for a response.
 * If the connection times out or an error occurs, it rejects the promise with an error.
 * @param message Message to send to the WebSocket server.
 * @param pluginName Name of the plugin to send the message to. This is used to identify the plugin in the WebSocket server.
 * @param apps Apps to send the message to. This is an array of `MetroInspectorApp` objects.
 * @param timeoutMs Timeout in milliseconds to wait for a response. Defaults to 10 seconds.
 */
export async function sendCliMessageAsync(message, pluginName, apps, timeoutMs = DEFAULT_TIMEOUT_MS) {
    // Sanity check: ensure that all apps share the same WebSocket URL
    if (apps.length === 0) {
        return Promise.reject(new SendMessageError('No apps provided to send the message to.', apps[0]));
    }
    // Check that all apps share the same broadcast URL
    if (apps.some((app) => new URL(app.webSocketDebuggerUrl).host !== new URL(apps[0].webSocketDebuggerUrl).host)) {
        return Promise.reject(new SendMessageError('All apps should share the same WebSocket URL hostname to send messages.' +
            apps[0].webSocketDebuggerUrl, apps[0]));
    }
    // Create connection
    const url = new URL(apps[0].webSocketDebuggerUrl);
    const address = `ws://${url.host}/expo-dev-plugins/broadcast`;
    // Create results for all apps
    const results = apps.reduce((acc, app) => ({
        ...acc,
        [app.id]: null,
    }), {});
    // Create a websocket connection to the broadcast channel
    const ws = new WebSocket(address);
    // Lets do the rest of the handling in the event listeners through a promise that will be resolved
    // when we get a response for the message we sent
    return new Promise((resolve, reject) => {
        // Setup timeout handler
        const timeoutHandler = setTimeout(() => {
            // Close the WebSocket to allow the process to exit
            ws.close();
            // Check if no results are resolved - this is an error:
            if (Object.values(results).every((result) => result === null)) {
                const errorMessage = `Timeout while waiting for response from apps.`;
                reject(new SendMessageError(errorMessage, apps.find((a) => results[a.id] === null)));
            }
            else if (Object.values(results).some((result) => result !== null)) {
                // We got partial results - this is ok, but with a warning - update results for each of the apps
                // that didn't respond with a warning message
                Object.keys(results).forEach((key) => {
                    if (results[key] === null) {
                        results[key] = 'No response (timeout)';
                    }
                });
                resolve(results);
            }
            // Clear the timeout handler
            clearTimeout(timeoutHandler);
        }, timeoutMs);
        ws.addEventListener('message', ({ data }) => {
            const parsedData = parseWebSocketData(data);
            const { messageKey, payload } = parsedData;
            if (messageKey.pluginName === pluginName && messageKey.method === message + '_response') {
                // We got a response for our message. Now get the app ID and result
                const { deviceName, applicationId } = payload;
                const result = payload.message;
                const app = apps.find((app) => getDeviceIdentifier(app) === formatDeviceIdentifier(deviceName, applicationId));
                if (!app) {
                    reject(new Error(`Received response for unknown app: ${deviceName} (${applicationId}). Ignoring.`));
                    return;
                }
                results[app.id] = result.toString();
                // Check if we have results for all apps
                if (Object.values(results).every((result) => result !== null)) {
                    clearTimeout(timeoutHandler);
                    ws.close();
                    // Resolve the promise with the results
                    resolve(results);
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
            ws.close();
            console.error(`Failed to connect to the WebSocket server at ${url}`);
            reject(new Error(`Failed to connect to the WebSocket server at ${url}`));
        });
        ws.addEventListener('close', () => {
            clearTimeout(timeoutHandler);
        });
    });
}
const getMessageKey = (pluginName, method) => ({
    pluginName,
    method,
});
function parseWebSocketData(data) {
    if (typeof data === 'string') {
        return JSON.parse(data);
    }
    else if (data instanceof Buffer) {
        return JSON.parse(data.toString());
    }
    else if (data instanceof ArrayBuffer) {
        return JSON.parse(Buffer.from(data).toString());
    }
    else if (Array.isArray(data)) {
        return JSON.parse(Buffer.concat(data).toString());
    }
    throw new Error('Unsupported WebSocket data type');
}
const getDeviceIdentifier = (app) => {
    // Use the deviceName + app ID as the device identifier
    return formatDeviceIdentifier(app.deviceName, app.appId);
};
const formatDeviceIdentifier = (deviceName, applicationId) => {
    // Use the deviceName + app ID as the device identifier
    return `${deviceName} (${applicationId})`;
};
//# sourceMappingURL=sendCliMessage.js.map