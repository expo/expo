import { App, ModuleBase } from 'expo-firebase-app';
import IOSMessaging from './IOSMessaging';
import RemoteMessage from './RemoteMessage';
export declare type OnMessage = (message: RemoteMessage) => any;
export declare type OnMessageObserver = {
    next: OnMessage;
};
export declare type OnTokenRefresh = (token: string) => any;
export declare type OnTokenRefreshObserver = {
    next: OnTokenRefresh;
};
export declare const MODULE_NAME = "ExpoFirebaseMessaging";
export declare const NAMESPACE = "messaging";
export declare const statics: {
    RemoteMessage: typeof RemoteMessage;
};
/**
 * @class Messaging
 */
export default class Messaging extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {
        RemoteMessage: typeof RemoteMessage;
    };
    _ios: IOSMessaging;
    constructor(app: App);
    readonly ios: IOSMessaging;
    onMessage(nextOrObserver: OnMessage | OnMessageObserver): () => any;
    onTokenRefresh(nextOrObserver: OnTokenRefresh | OnTokenRefreshObserver): () => any;
    /**
     * NON WEB-SDK METHODS
     */
    sendMessage(remoteMessage: RemoteMessage): Promise<void>;
    subscribeToTopic(topic: string): Promise<void>;
    unsubscribeFromTopic(topic: string): Promise<void>;
    /**
     * KNOWN UNSUPPORTED METHODS
     */
    getToken(): Promise<string>;
    requestPermission(): Promise<void>;
    hasPermission(): Promise<boolean>;
    deleteToken(): void;
    setBackgroundMessageHandler(): void;
    useServiceWorker(): void;
}
export { NativeInboundRemoteMessage, NativeOutboundRemoteMessage, Notification } from './types';
export { RemoteMessage };
