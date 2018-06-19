import { NativeEventEmitter, Platform } from 'react-native';

class EventEmitter {
  _listenersCount = 0;
  _nativeModule = null;
  _eventEmitter: NativeEventEmitter;

  constructor(nativeModule) {
    this._nativeModule = nativeModule;
    this._eventEmitter = new NativeEventEmitter(nativeModule);
  }

  addListener(eventName, listener) {
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

  removeAllListeners(): void {
    if (Platform.OS === 'android' && this._nativeModule.stopObserving) {
      this._nativeModule.stopObserving();
    }

    this._eventEmitter.removeAllListeners(this._nativeEventName);
    this._listenersCount = 0;
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
