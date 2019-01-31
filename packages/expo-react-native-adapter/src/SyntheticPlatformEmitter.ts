import RCTDeviceEventEmitter from 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter';
import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';

/*
 * This emitter is used for sending synthetic native events to listeners
 * registered in the API layer with `NativeEventEmitter`.
 */
class SyntheticPlatformEmitter {
  _emitter = new EventEmitter(RCTDeviceEventEmitter.sharedSubscriber);

  emit(eventName: string, props: any): void {
    this._emitter.emit(eventName, props);
  }
}

export default new SyntheticPlatformEmitter();
