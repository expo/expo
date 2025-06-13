"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMessageError = void 0;
exports.sendMessageAsync = sendMessageAsync;
const ws_1 = require("ws");
class SendMessageError extends Error {
    app;
    constructor(message, app) {
        super(message);
        this.app = app;
    }
}
exports.SendMessageError = SendMessageError;
const getDeviceIdentifier = (app) => {
    // Use the deviceName + app ID as the device identifier
    return formatDeviceIdentifier(app.deviceName, app.appId);
};
const formatDeviceIdentifier = (deviceName, applicationId) => {
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
async function sendMessageAsync(message, apps, timeoutMs = 10_000) {
    // Sanity check: ensure that all apps share the same WebSocket URL
    if (apps.length === 0) {
        return Promise.reject(new SendMessageError('No apps provided to send the message to.', apps[0]));
    }
    // Check that all apps share the same broadcast URL
    if (apps.some((app) => new URL(app.webSocketDebuggerUrl).host !== new URL(apps[0].webSocketDebuggerUrl).host)) {
        return Promise.reject(new SendMessageError('All apps must share the same WebSocket URL to send messages.' +
            apps[0].webSocketDebuggerUrl, apps[0]));
    }
    // Create connection
    const url = new URL(apps[0].webSocketDebuggerUrl);
    const address = `ws://${url.host}/expo-dev-plugins/broadcast`;
    const pluginName = 'expo-backgroundtask-devtools-plugin';
    // Create results for all apps
    const results = apps.reduce((acc, app) => ({
        ...acc,
        [app.id]: null,
    }), {});
    // Create a websocket connection to the broadcast channel
    const ws = new ws_1.WebSocket(address);
    // Lets do the rest of the handling in the event listeners through a promise that will be resolved
    // when we get a response for the message we sent
    return new Promise((resolve, reject) => {
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
                    resolve(Object.keys(results).map((key) => ({
                        id: key,
                        result: results[key],
                    })));
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
