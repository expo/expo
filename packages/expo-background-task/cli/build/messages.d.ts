import { DevtoolsApp } from './types';
export declare class SendMessageError extends Error {
    app: DevtoolsApp;
    constructor(message: string, app: DevtoolsApp);
}
/**
 * Sends out a message to the WebSocket server using a broadcast channel.
 * This function connects to the WebSocket server, sends a message, and waits for a response.
 * If the connection times out or an error occurs, it rejects the promise with an error.
 * @param message Message to send to the WebSocket server.
 * @param apps Apps to send the message to. This is an array of `MetroInspectorApp` objects.
 */
export declare function sendMessageAsync(message: string, apps: DevtoolsApp[], timeoutMs?: number): Promise<{
    id: string;
    result: string;
}[]>;
