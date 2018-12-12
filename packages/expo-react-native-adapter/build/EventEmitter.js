import invariant from 'invariant';
import { Platform } from 'react-native';
// Importing this directly will circumvent the webpack alias `react-native$`. This will enable us to
// use NativeEventEmitter from React Native and not from RNWeb.
import NativeEventEmitter from 'react-native/Libraries/EventEmitter/NativeEventEmitter';
const nativeEmitterSubscriptionKey = '@@nativeEmitterSubscription@@';
export class EventEmitter {
    constructor(nativeModule) {
        this._listenerCount = 0;
        this._nativeModule = nativeModule;
        this._eventEmitter = new NativeEventEmitter(nativeModule);
    }
    addListener(eventName, listener) {
        if (!this._listenerCount && Platform.OS === 'android' && this._nativeModule.startObserving) {
            this._nativeModule.startObserving();
        }
        this._listenerCount++;
        const nativeEmitterSubscription = this._eventEmitter.addListener(eventName, listener);
        const subscription = {
            [nativeEmitterSubscriptionKey]: nativeEmitterSubscription,
            remove: () => {
                this.removeSubscription(subscription);
            },
        };
        return subscription;
    }
    removeAllListeners(eventName) {
        const removedListenerCount = this._eventEmitter.listeners(eventName).length;
        this._eventEmitter.removeAllListeners(eventName);
        this._listenerCount -= removedListenerCount;
        invariant(this._listenerCount >= 0, `EventEmitter must have a non-negative number of listeners`);
        if (!this._listenerCount && Platform.OS === 'android' && this._nativeModule.stopObserving) {
            this._nativeModule.stopObserving();
        }
    }
    removeSubscription(subscription) {
        const nativeEmitterSubscription = subscription[nativeEmitterSubscriptionKey];
        if (!nativeEmitterSubscription) {
            return;
        }
        this._eventEmitter.removeSubscription(nativeEmitterSubscription);
        this._listenerCount--;
        if (!this._listenerCount && Platform.OS === 'android' && this._nativeModule.stopObserving) {
            this._nativeModule.stopObserving();
        }
    }
    emit(eventName, ...params) {
        this._eventEmitter.emit(eventName, ...params);
    }
}
//# sourceMappingURL=EventEmitter.js.map