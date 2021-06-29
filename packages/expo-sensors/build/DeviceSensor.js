import { EventEmitter, Platform } from '@unimodules/core';
import { PermissionStatus } from 'expo-modules-core';
/**
 * A base class for subscribable sensors. The events emitted by this class are measurements
 * specified by the parameter type `M`.
 */
export default class DeviceSensor {
    constructor(nativeSensorModule, nativeEventName) {
        this.addListener = (listener) => {
            const subscription = this._nativeEmitter.addListener(this._nativeEventName, listener);
            subscription.remove = () => this.removeSubscription(subscription);
            this._listenerCount++;
            return subscription;
        };
        this.hasListeners = () => {
            return this._listenerCount > 0;
        };
        this.getListenerCount = () => {
            return this._listenerCount;
        };
        this.removeAllListeners = () => {
            this._listenerCount = 0;
            this._nativeEmitter.removeAllListeners(this._nativeEventName);
        };
        this.removeSubscription = (subscription) => {
            this._listenerCount--;
            this._nativeEmitter.removeSubscription(subscription);
        };
        this.setUpdateInterval = (intervalMs) => {
            if (!this._nativeModule.setUpdateInterval) {
                console.warn(`expo-sensors: setUpdateInterval() is not supported on ${Platform.OS}`);
            }
            else {
                this._nativeModule.setUpdateInterval(intervalMs);
            }
        };
        this.isAvailableAsync = async () => {
            if (!this._nativeModule.isAvailableAsync) {
                return false;
            }
            else {
                return await this._nativeModule.isAvailableAsync();
            }
        };
        this.getPermissionsAsync = async () => {
            if (!this._nativeModule.getPermissionsAsync) {
                return defaultPermissionsResponse;
            }
            else {
                return await this._nativeModule.getPermissionsAsync();
            }
        };
        this.requestPermissionsAsync = async () => {
            if (!this._nativeModule.requestPermissionsAsync) {
                return defaultPermissionsResponse;
            }
            else {
                return await this._nativeModule.requestPermissionsAsync();
            }
        };
        this._nativeModule = nativeSensorModule;
        this._nativeEmitter = new EventEmitter(nativeSensorModule);
        this._nativeEventName = nativeEventName;
        this._listenerCount = 0;
    }
}
const defaultPermissionsResponse = {
    granted: true,
    expires: 'never',
    canAskAgain: true,
    status: PermissionStatus.GRANTED,
};
//# sourceMappingURL=DeviceSensor.js.map