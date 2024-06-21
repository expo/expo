import { DeviceEventEmitter } from 'react-native';

import {
  assertSensorEventEnabledAsync,
  getPermissionsAsync,
  isSensorEnabledAsync,
  requestPermissionsAsync,
} from './utils/isSensorEnabledAsync.web';

const eventName = 'devicemotion';

export default {
  async isAvailableAsync(): Promise<boolean> {
    if (typeof DeviceMotionEvent === 'undefined') {
      return false;
    }
    return await isSensorEnabledAsync(eventName);
  },
  _handleMotion({ accelerationIncludingGravity }) {
    DeviceEventEmitter.emit('gyroscopeDidUpdate', {
      x: accelerationIncludingGravity.x,
      y: accelerationIncludingGravity.y,
      z: accelerationIncludingGravity.z,
      timestamp: accelerationIncludingGravity.timeStamp / 1000,
    });
  },
  getPermissionsAsync,
  requestPermissionsAsync,
  startObserving() {
    assertSensorEventEnabledAsync(eventName);

    window.addEventListener(eventName, this._handleMotion);
  },
  stopObserving() {
    window.removeEventListener(eventName, this._handleMotion);
  },
};
