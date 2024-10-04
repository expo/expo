import { EventEmitter, EventSubscription } from 'fbemitter';
import type { ConnectionInfo } from './devtools.types';
export declare const MESSAGE_PROTOCOL_VERSION = 2;
export declare const DevToolsPluginMethod = "Expo:DevToolsPlugin";
/**
 * This client is for the Expo DevTools Plugins to communicate between the app and the DevTools webpage hosted in a browser.
 * All the code should be both compatible with browsers and React Native.
 */
export declare abstract class DevToolsPluginClient {
    readonly connectionInfo: ConnectionInfo;
    protected eventEmitter: EventEmitter;
    constructor(connectionInfo: ConnectionInfo);
    /**
     * Initialize the connection.
     * @hidden
     */
    abstract initAsync(): Promise<void>;
    /**
     * Close the connection.
     */
    abstract closeAsync(): Promise<void>;
    /**
     * Send a message to the other end of DevTools.
     * @param method A method name.
     * @param params any extra payload.
     */
    abstract sendMessage(method: string, params: any): void;
    /**
     * Subscribe to a message from the other end of DevTools.
     * @param method Subscribe to a message with a method name.
     * @param listener Listener to be called when a message is received.
     */
    addMessageListener(method: string, listener: (params: any) => void): EventSubscription;
    /**
     * Subscribe to a message from the other end of DevTools just once.
     * @param method Subscribe to a message with a method name.
     * @param listener Listener to be called when a message is received.
     */
    addMessageListenerOnce(method: string, listener: (params: any) => void): void;
    /**
     * Returns whether the client is connected to the server.
     */
    abstract isConnected(): boolean;
    protected handleMessage: (event: WebSocketMessageEvent) => void;
}
//# sourceMappingURL=DevToolsPluginClient.d.ts.map