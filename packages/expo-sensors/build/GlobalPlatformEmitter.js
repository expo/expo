import RCTDeviceEventEmitter from 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter';
import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
/*
 * Used for sending web-native "back-end" events to "front-end" API NativeEventEmitter listeners.
 */
class GlobalPlatformEmitter extends EventEmitter {
    constructor() {
        super(RCTDeviceEventEmitter.sharedSubscriber);
    }
    emit(eventName, props) {
        super.emit(eventName, props);
    }
}
export default new GlobalPlatformEmitter();
//# sourceMappingURL=GlobalPlatformEmitter.js.map