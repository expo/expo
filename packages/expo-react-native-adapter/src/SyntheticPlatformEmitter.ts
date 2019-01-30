import RCTDeviceEventEmitter from 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter';
import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';

/*
 * This emitter is used for sending synthetic native events to listeners
 * registered in the API layer with `NativeEventEmitter`.
 */
class SyntheticPlatformEmitter extends EventEmitter {
  constructor() {
    super(RCTDeviceEventEmitter.sharedSubscriber);
  }

  emit(eventName: string, props: any): void {
    super.emit(eventName, props);
  }
}

export default new SyntheticPlatformEmitter();
