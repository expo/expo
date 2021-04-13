import { SyntheticPlatformEmitter } from '@unimodules/core';

import {
  assertSensorEventEnabledAsync,
  getPermissionsAsync,
  isSensorEnabledAsync,
  requestPermissionsAsync,
} from './utils/isSensorEnabledAsync.web';

const eventName = 'devicemotion';

export default {
  get name(): string {
    return 'ExponentGyroscope';
  },
  async isAvailableAsync(): Promise<boolean> {
    if (typeof DeviceMotionEvent === 'undefined') {
      return false;
    }
    return await isSensorEnabledAsync(eventName);
  },
  _handleMotion({ accelerationIncludingGravity }) {
    SyntheticPlatformEmitter.emit('gyroscopeDidUpdate', {
      x: accelerationIncludingGravity.x,
      y: accelerationIncludingGravity.y,
      z: accelerationIncludingGravity.z,
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
