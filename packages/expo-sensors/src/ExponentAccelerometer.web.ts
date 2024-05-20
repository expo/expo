import { DeviceEventEmitter } from 'react-native';

import {
  assertSensorEventEnabledAsync,
  getPermissionsAsync,
  isSensorEnabledAsync,
  requestPermissionsAsync,
} from './utils/isSensorEnabledAsync.web';

const scalar = Math.PI / 180;
const eventName = 'deviceorientation';

export default {
  async isAvailableAsync(): Promise<boolean> {
    if (typeof DeviceOrientationEvent === 'undefined') {
      return false;
    }
    return await isSensorEnabledAsync(eventName);
  },
  _handleMotion({ alpha, beta, gamma, timeStamp }) {
    DeviceEventEmitter.emit('accelerometerDidUpdate', {
      x: gamma * scalar,
      y: beta * scalar,
      z: alpha * scalar,
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
