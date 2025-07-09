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
  _handleMotion({ accelerationIncludingGravity: acceleration, timeStamp }: DeviceMotionEvent) {
    // Abort if data is missing from the event
    if (acceleration === null) return;

    DeviceEventEmitter.emit('gyroscopeDidUpdate', {
      x: acceleration.x,
      y: acceleration.y,
      z: acceleration.z,
      timestamp: timeStamp / 1000,
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
