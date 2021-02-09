import { DeviceEventEmitter } from 'react-native';

import { RCTEventEmitter } from './nativeEmitters';

/**
 * This emitter is used for sending synthetic native events to listeners
 * registered in the API layer with `NativeEventEmitter`.
 */
class SyntheticPlatformEmitter {
  _emitter = new RCTEventEmitter(DeviceEventEmitter.sharedSubscriber);

  emit(eventName: string, props: any): void {
    this._emitter.emit(eventName, props);
  }
}

export default new SyntheticPlatformEmitter();
