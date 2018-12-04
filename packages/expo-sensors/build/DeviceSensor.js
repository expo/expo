import { EventEmitter } from 'expo-core';
/**
 * A base class for subscribable sensors. The events emitted by this class are measurements
 * specified by the parameter type `M`.
 */
export default class DeviceSensor {
    constructor(nativeSensorModule, nativeEventName) {
        this._nativeModule = nativeSensorModule;
        this._nativeEmitter = new EventEmitter(nativeSensorModule);
        this._nativeEventName = nativeEventName;
        this._listenerCount = 0;
    }
    addListener(listener) {
        let subscription = this._nativeEmitter.addListener(this._nativeEventName, listener);
        subscription.remove = () => this.removeSubscription(subscription);
        this._listenerCount++;
        return subscription;
    }
    hasListeners() {
        return this._listenerCount > 0;
    }
    getListenerCount() {
        return this._listenerCount;
    }
    removeAllListeners() {
        this._listenerCount = 0;
        this._nativeEmitter.removeAllListeners(this._nativeEventName);
    }
    removeSubscription(subscription) {
        this._listenerCount--;
        this._nativeEmitter.removeSubscription(subscription);
    }
    setUpdateInterval(intervalMs) {
        this._nativeModule.setUpdateInterval(intervalMs);
    }
}
//# sourceMappingURL=DeviceSensor.js.map