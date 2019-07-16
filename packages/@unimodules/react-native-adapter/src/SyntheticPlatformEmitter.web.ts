import EventEmitter from 'react-native-web/dist/vendor/react-native/emitter/EventEmitter';
import DeviceEventEmitter from 'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter';

/**
 * This emitter is used for sending synthetic native events to listeners
 * registered in the API layer with `NativeEventEmitter`.
 */
class SyntheticPlatformEmitter {
  _emitter = new EventEmitter(DeviceEventEmitter.sharedSubscriber);

  emit(eventName: string, props: any): void {
    this._emitter.emit(eventName, props);
  }
}

export default new SyntheticPlatformEmitter();
