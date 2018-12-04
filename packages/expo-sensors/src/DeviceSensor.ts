import { EventEmitter, Subscription } from 'expo-core';

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

  addListener(listener: Listener<M>): Subscription {
    let subscription = this._nativeEmitter.addListener(this._nativeEventName, listener);
    subscription.remove = () => this.removeSubscription(subscription);
    this._listenerCount++;
    return subscription;
  }

  hasListeners(): boolean {
    return this._listenerCount > 0;
  }

  getListenerCount(): number {
    return this._listenerCount;
  }

  removeAllListeners(): void {
    this._listenerCount = 0;
    this._nativeEmitter.removeAllListeners(this._nativeEventName);
  }

  removeSubscription(subscription: Subscription): void {
    this._listenerCount--;
    this._nativeEmitter.removeSubscription(subscription);
  }

  setUpdateInterval(intervalMs: number): void {
    this._nativeModule.setUpdateInterval(intervalMs);
  }
}
