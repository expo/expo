import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
import RCTDeviceEventEmitter from 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter';
/**
 * This emitter is used for sending synthetic native events to listeners
 * registered in the API layer with `NativeEventEmitter`.
 */
class SyntheticPlatformEmitter {
    constructor() {
        this._emitter = new EventEmitter(RCTDeviceEventEmitter.sharedSubscriber);
    }
    emit(eventName, props) {
        this._emitter.emit(eventName, props);
    }
}
export default new SyntheticPlatformEmitter();
//# sourceMappingURL=SyntheticPlatformEmitter.js.map