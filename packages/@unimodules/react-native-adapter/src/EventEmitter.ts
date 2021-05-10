import invariant from 'invariant';
import { NativeEventEmitter, Platform } from 'react-native';

const nativeEmitterSubscriptionKey = '@@nativeEmitterSubscription@@';

type NativeModule = {
  startObserving?: () => void;
  stopObserving?: () => void;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

// @needsAudit
export type Subscription = {
  /**
   * A method to unsubscribe the listener.
   */
  remove: () => void;
};

export class EventEmitter {
  _listenerCount = 0;
  _nativeModule: NativeModule;
  _eventEmitter: NativeEventEmitter;

  constructor(nativeModule: NativeModule) {
    this._nativeModule = nativeModule;
    this._eventEmitter = new NativeEventEmitter(nativeModule as any);
  }

  addListener<T>(eventName: string, listener: (event: T) => void): Subscription {
    if (!this._listenerCount && Platform.OS !== 'ios' && this._nativeModule.startObserving) {
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

  removeAllListeners(eventName: string): void {
    const removedListenerCount = this._eventEmitter.listeners(eventName).length;
    this._eventEmitter.removeAllListeners(eventName);
    this._listenerCount -= removedListenerCount;
    invariant(
      this._listenerCount >= 0,
      `EventEmitter must have a non-negative number of listeners`
    );

    if (!this._listenerCount && Platform.OS !== 'ios' && this._nativeModule.stopObserving) {
      this._nativeModule.stopObserving();
    }
  }

  removeSubscription(subscription: Subscription): void {
    const nativeEmitterSubscription = subscription[nativeEmitterSubscriptionKey];
    if (!nativeEmitterSubscription) {
      return;
    }

    this._eventEmitter.removeSubscription(nativeEmitterSubscription!);
    this._listenerCount--;

    // Ensure that the emitter's internal state remains correct even if `removeSubscription` is
    // called again with the same subscription
    delete subscription[nativeEmitterSubscriptionKey];

    // Release closed-over references to the emitter
    subscription.remove = () => {};

    if (!this._listenerCount && Platform.OS !== 'ios' && this._nativeModule.stopObserving) {
      this._nativeModule.stopObserving();
    }
  }

  emit(eventName: string, ...params: any[]): void {
    this._eventEmitter.emit(eventName, ...params);
  }
}
