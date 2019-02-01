import { INTERNALS, ModuleBase, SharedEventEmitter, utils } from 'expo-firebase-app';
import invariant from 'invariant';
import IOSMessaging from './IOSMessaging';
import RemoteMessage from './RemoteMessage';
const { isFunction, isObject } = utils;
const NATIVE_EVENTS = {
    messageReceived: 'Expo.Firebase.messaging_message_received',
    tokenRefreshed: 'Expo.Firebase.messaging_token_refreshed',
};
export const MODULE_NAME = 'ExpoFirebaseMessaging';
export const NAMESPACE = 'messaging';
export const statics = {
    RemoteMessage,
};
/**
 * @class Messaging
 */
export default class Messaging extends ModuleBase {
    constructor(app) {
        super(app, {
            events: Object.values(NATIVE_EVENTS),
            moduleName: MODULE_NAME,
            hasMultiAppSupport: false,
            hasCustomUrlSupport: false,
            namespace: NAMESPACE,
        });
        this._ios = new IOSMessaging(this);
        SharedEventEmitter.addListener(
        // sub to internal native event - this fans out to
        // public event name: onMessage
        NATIVE_EVENTS.messageReceived, (message) => {
            SharedEventEmitter.emit('onMessage', new RemoteMessage(message));
        });
        SharedEventEmitter.addListener(
        // sub to internal native event - this fans out to
        // public event name: onMessage
        NATIVE_EVENTS.tokenRefreshed, ({ token }) => {
            SharedEventEmitter.emit('onTokenRefresh', token);
        });
        // Tell the native module that we're ready to receive events
        if (this.nativeModule.jsInitialised) {
            this.nativeModule.jsInitialised();
        }
    }
    get ios() {
        return this._ios;
    }
    onMessage(nextOrObserver) {
        let listener;
        if (nextOrObserver && typeof nextOrObserver === 'function') {
            // $FlowExpectedError: Not coping with the overloaded method signature
            listener = nextOrObserver;
        }
        else if (isObject(nextOrObserver) && isFunction(nextOrObserver.next)) {
            listener = nextOrObserver.next;
        }
        else {
            throw new Error('Messaging.onMessage failed: First argument must be a function or observer object with a `next` function.');
        }
        this.logger.info('Creating onMessage listener');
        SharedEventEmitter.addListener('onMessage', listener);
        return () => {
            this.logger.info('Removing onMessage listener');
            SharedEventEmitter.removeListener('onMessage', listener);
        };
    }
    onTokenRefresh(nextOrObserver) {
        let listener;
        if (nextOrObserver && typeof nextOrObserver === 'function') {
            // $FlowExpectedError: Not coping with the overloaded method signature
            listener = nextOrObserver;
        }
        else if (isObject(nextOrObserver) && isFunction(nextOrObserver.next)) {
            listener = nextOrObserver.next;
        }
        else {
            throw new Error('Messaging.onTokenRefresh failed: First argument must be a function or observer object with a `next` function.');
        }
        this.logger.info('Creating onTokenRefresh listener');
        SharedEventEmitter.addListener('onTokenRefresh', listener);
        return () => {
            this.logger.info('Removing onTokenRefresh listener');
            SharedEventEmitter.removeListener('onTokenRefresh', listener);
        };
    }
    /**
     * NON WEB-SDK METHODS
     */
    async sendMessage(remoteMessage) {
        invariant(remoteMessage instanceof RemoteMessage, `Messaging:sendMessage expects a 'RemoteMessage' but got type ${typeof remoteMessage}`);
        return await this.nativeModule.sendMessage(remoteMessage.build());
    }
    async subscribeToTopic(topic) {
        return await this.nativeModule.subscribeToTopic(topic);
    }
    async unsubscribeFromTopic(topic) {
        return await this.nativeModule.unsubscribeFromTopic(topic);
    }
    /**
     * KNOWN UNSUPPORTED METHODS
     */
    async getToken() {
        throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'getToken'));
    }
    async requestPermission() {
        throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'requestPermission'));
    }
    async hasPermission() {
        throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'hasPermission'));
    }
    deleteToken() {
        throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'deleteToken'));
    }
    setBackgroundMessageHandler() {
        throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'setBackgroundMessageHandler'));
    }
    useServiceWorker() {
        throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'useServiceWorker'));
    }
}
Messaging.moduleName = MODULE_NAME;
Messaging.namespace = NAMESPACE;
Messaging.statics = statics;
export { RemoteMessage };
//# sourceMappingURL=index.js.map