import invariant from 'invariant';
import { Platform } from 'react-native';
// Importing this directly will circumvent the webpack alias `react-native$`. This will enable us to
// use NativeEventEmitter from React Native and not from RNWeb.
import NativeEventEmitter from 'react-native/Libraries/EventEmitter/NativeEventEmitter';

const nativeEmitterSubscriptionKey = '@@nativeEmitterSubscription@@';

type NativeModule = {
  startObserving?: () => void;
  stopObserving?: () => void;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

export type Subscription = {
  remove: () => void;
};

export class EventEmitter {
  _listenerCount = 0;
  _nativeModule: NativeModule;
  _eventEmitter: NativeEventEmitter | null;

  constructor(nativeModule: NativeModule) {
    this._nativeModule = nativeModule;
    this._eventEmitter = null;
    if (nativeModule) {
      this._eventEmitter = new NativeEventEmitter(nativeModule);
    }
  }

  addListener<T>(eventName: string, listener: (event: T) => void): Subscription {
    if (!this._eventEmitter) {
      console.warn('')
      return {
        remove: () => undefined
      };
    }

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
    if (!this._eventEmitter) {
      return;
    }

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
    if (!nativeEmitterSubscription || !this._eventEmitter) {
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
    if (this._eventEmitter) {
      this._eventEmitter.emit(eventName, ...params);
    }
  }
}
