import RCTDeviceEventEmitter from 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter';
import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';

/*
 * Used for sending native-layer events to API-layer NativeEventEmitter listeners.
 */
class GlobalPlatformEmitter extends EventEmitter {
  constructor() {
    super(RCTDeviceEventEmitter.sharedSubscriber);
  }

  emit(eventName: string, props: any): void {
    super.emit(eventName, props);
  }
}

export default new GlobalPlatformEmitter();
