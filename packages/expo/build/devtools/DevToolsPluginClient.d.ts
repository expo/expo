import { EventEmitter, EventSubscription } from 'fbemitter';
import { WebSocketBackingStore } from './WebSocketBackingStore';
import type { ConnectionInfo, DevToolsPluginClientOptions, HandshakeMessageParams } from './devtools.types';
/**
 * This client is for the Expo DevTools Plugins to communicate between the app and the DevTools webpage hosted in a browser.
 * All the code should be both compatible with browsers and React Native.
 */
export declare abstract class DevToolsPluginClient {
    readonly connectionInfo: ConnectionInfo;
    private readonly options?;
    protected eventEmitter: EventEmitter;
    private static defaultWSStore;
    private readonly wsStore;
    protected isClosed: boolean;
    protected retries: number;
    private readonly messageFramePacker;
    constructor(connectionInfo: ConnectionInfo, options?: DevToolsPluginClientOptions | undefined);
    /**
     * Initialize the connection.
     * @hidden
     */
    initAsync(): Promise<void>;
    /**
     * Close the connection.
     */
    closeAsync(): Promise<void>;
    /**
     * Send a message to the other end of DevTools.
     * @param method A method name.
     * @param params any extra payload.
     */
    sendMessage(method: string, params: any): void;
    protected sendMessageLegacy(method: string, params: any): void;
    private sendMessageImpl;
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
     * Internal handshake message sender.
     * @hidden
     */
    protected sendHandshakeMessage(params: HandshakeMessageParams): void;
    /**
     * Internal handshake message listener.
     * @hidden
     */
    protected addHandskakeMessageListener(listener: (params: HandshakeMessageParams) => void): Partial<EventSubscription>;
    /**
     * Returns whether the client is connected to the server.
     */
    isConnected(): boolean;
    /**
     * The method to create the WebSocket connection.
     */
    protected connectAsync(): Promise<WebSocket>;
    protected handleMessage: (event: WebSocketMessageEvent) => Promise<void>;
    /**
     * Get the WebSocket backing store. Exposed for testing.
     * @hidden
     */
    getWebSocketBackingStore(): WebSocketBackingStore;
}
//# sourceMappingURL=DevToolsPluginClient.d.ts.map