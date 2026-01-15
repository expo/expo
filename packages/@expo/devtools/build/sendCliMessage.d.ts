import { ExpoCliExtensionAppInfo } from './CliExtension.types.js';
/**
 * Sends out a message to the WebSocket server using a broadcast channel and waits for a response.
 * If the connection times out or an error occurs, it rejects the promise with an error.
 * @param message Message to send to the WebSocket server.
 * @param pluginName Name of the plugin to send the message to. This is used to identify the plugin in the WebSocket server.
 * @param app App to send the message to. This is a `MetroInspectorApp` object.
 * @param params Optional parameters to include in the message payload.
 * @param timeoutMs Timeout in milliseconds to wait for a response. Defaults to 10 seconds.
 */
export declare function sendCliMessageAsync<Params extends Record<string, unknown>>(message: string, pluginName: string, app: ExpoCliExtensionAppInfo, params?: Params, timeoutMs?: number): Promise<string | null>;
//# sourceMappingURL=sendCliMessage.d.ts.map