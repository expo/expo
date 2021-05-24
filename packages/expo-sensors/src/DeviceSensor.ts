import { EventEmitter, Subscription, Platform } from '@unimodules/core';
import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

type Listener<E> = (event: E) => void;

type NativeSensorModule = any;

/**
 * A base class for subscribable sensors. The events emitted by this class are measurements
 * specified by the parameter type `M`.
 */
export default class DeviceSensor<M> {
  _nativeModule: NativeSensorModule;
  _nativeEmitter: EventEmitter;
  _nativeEventName: string;
  _listenerCount: number;

  constructor(nativeSensorModule: NativeSensorModule, nativeEventName: string) {
    this._nativeModule = nativeSensorModule;

    this._nativeEmitter = new EventEmitter(nativeSensorModule);
    this._nativeEventName = nativeEventName;
    this._listenerCount = 0;
  }

  addListener = (listener: Listener<M>): Subscription => {
    const subscription = this._nativeEmitter.addListener(this._nativeEventName, listener);
    subscription.remove = () => this.removeSubscription(subscription);
    this._listenerCount++;
    return subscription;
  };

  hasListeners = (): boolean => {
    return this._listenerCount > 0;
  };

  getListenerCount = (): number => {
    return this._listenerCount;
  };

  removeAllListeners = (): void => {
    this._listenerCount = 0;
    this._nativeEmitter.removeAllListeners(this._nativeEventName);
  };

  removeSubscription = (subscription: Subscription): void => {
    this._listenerCount--;
    this._nativeEmitter.removeSubscription(subscription);
  };

  setUpdateInterval = (intervalMs: number): void => {
    if (!this._nativeModule.setUpdateInterval) {
      console.warn(`expo-sensors: setUpdateInterval() is not supported on ${Platform.OS}`);
    } else {
      this._nativeModule.setUpdateInterval(intervalMs);
    }
  };

  isAvailableAsync = async (): Promise<boolean> => {
    if (!this._nativeModule.isAvailableAsync) {
      return false;
    } else {
      return await this._nativeModule.isAvailableAsync();
    }
  };

  getPermissionsAsync = async (): Promise<PermissionResponse> => {
    if (!this._nativeModule.getPermissionsAsync) {
      return defaultPermissionsResponse;
    } else {
      return await this._nativeModule.getPermissionsAsync();
    }
  };

  requestPermissionsAsync = async (): Promise<PermissionResponse> => {
    if (!this._nativeModule.requestPermissionsAsync) {
      return defaultPermissionsResponse;
    } else {
      return await this._nativeModule.requestPermissionsAsync();
    }
  };
}

const defaultPermissionsResponse: PermissionResponse = {
  granted: true,
  expires: 'never',
  canAskAgain: true,
  status: PermissionStatus.GRANTED,
};
