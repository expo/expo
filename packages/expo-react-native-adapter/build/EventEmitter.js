import invariant from 'invariant';
import { Platform } from 'react-native';
// Importing this directly will circumvent the webpack alias `react-native$`. This will enable us to
// use NativeEventEmitter from React Native and not from RNWeb.
import NativeEventEmitter from 'react-native/Libraries/EventEmitter/NativeEventEmitter';
export default class EventEmitter {
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
        // IMPORTANT TODO: These subscriptions are misleading; calling remove() on one will not invoke
        // removeSubscription on this class, unlike how subclasses of the upstream EventEmitter work
        // (the returned subscriptions retain a reference to the emitter instance and call
        // removeSubscription with dynamic dispatch). Fix me and add a unit test.
        return this._eventEmitter.addListener(eventName, listener);
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
        this._eventEmitter.removeSubscription(subscription);
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