// @flow

import { NativeEventEmitter, Platform } from 'react-native';

type Subscription = {
  remove: () => void,
};

class EventEmitter {
  _listenersCount = 0;
  _nativeModule = null;
  _eventEmitter: NativeEventEmitter;

  constructor(nativeModule) {
    this._nativeModule = nativeModule;
    this._eventEmitter = new NativeEventEmitter(nativeModule);
  }

  addListener(eventName, listener): Subscription {
    this._listenersCount += 1;
    if (Platform.OS === 'android' && this._nativeModule.startObserving) {
      if (this._listenersCount === 1) {
        // We're not awaiting start of updates
        // they should start shortly.
        this._nativeModule.startObserving();
      }
    }
    return this._eventEmitter.addListener(eventName, listener);
  }

  removeAllListeners(eventName: string): void {
    const listenersToRemoveCount = this._eventEmitter.listeners(eventName).length;
    const newListenersCount = Math.max(0, this._listenersCount - listenersToRemoveCount);

    if (Platform.OS === 'android' && this._nativeModule.stopObserving && newListenersCount === 0) {
      this._nativeModule.stopObserving();
    }

    this._eventEmitter.removeAllListeners(eventName);
    this._listenersCount = newListenersCount;
  }

  removeSubscription(subscription: Subscription): void {
    this._listenersCount -= 1;

    if (Platform.OS === 'android' && this._nativeModule.stopObserving) {
      if (this._listenersCount === 0) {
        this._nativeModule.stopObserving();
      }
    }

    this._eventEmitter.removeSubscription(subscription);
  }
}

module.exports = EventEmitter;
