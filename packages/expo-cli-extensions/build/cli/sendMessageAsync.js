"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageAsync = sendMessageAsync;
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("./utils");
/**
 * Sends out a message to the WebSocket server using a broadcast channel and waits for a response.
 * If the connection times out or an error occurs, it rejects the promise with an error.
 * @param message Message to send to the WebSocket server.
 * @param pluginName Name of the plugin to send the message to. This is used to identify the plugin in the WebSocket server.
 * @param apps Apps to send the message to. This is an array of `MetroInspectorApp` objects.
 * @param timeoutMs Timeout in milliseconds to wait for a response. Defaults to 10 seconds.
 */
async function sendMessageAsync(message, pluginName, apps, timeoutMs = 10_000) {
    // Sanity check: ensure that all apps share the same WebSocket URL
    if (apps.length === 0) {
        return Promise.reject(new utils_1.SendMessageError('No apps provided to send the message to.', apps[0]));
    }
    // Check that all apps share the same broadcast URL
    if (apps.some((app) => new URL(app.webSocketDebuggerUrl).host !== new URL(apps[0].webSocketDebuggerUrl).host)) {
        return Promise.reject(new utils_1.SendMessageError('All apps must share the same WebSocket URL to send messages.' +
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
            // Check if any results are still not resolved - and then
            // we'll just reject those promises with a timeout error
            if (!Object.values(results).every((result) => result !== null)) {
                const errorMessage = `Timeout while waiting for response.`;
                reject(new utils_1.SendMessageError(errorMessage, apps[0]));
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
                const app = apps.find((app) => (0, utils_1.getDeviceIdentifier)(app) === (0, utils_1.formatDeviceIdentifier)(deviceName, applicationId));
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
                    resolve(formatResults(Object.keys(results).map((key) => ({
                        id: key,
                        result: results[key],
                    })), apps));
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
const formatResults = (results, apps) => {
    return results.length > 0
        ? results
            .map((r) => chalk_1.default.bold(apps.find((a) => a.id === r.id).title + ': ') + r.result)
            .join('\n')
        : chalk_1.default.yellow('No apps connected.');
};
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
//# sourceMappingURL=sendMessageAsync.js.map