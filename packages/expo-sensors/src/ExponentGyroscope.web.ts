import { SyntheticPlatformEmitter } from '@unimodules/core';
import {
  isSensorEnabledAsync,
  assertSensorEventEnabledAsync,
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
  async startObserving(): Promise<void> {
    window.addEventListener(eventName, this._handleMotion);
    try {
      await assertSensorEventEnabledAsync(eventName);
    } catch (error) {
      this.stopObserving();
      throw error;
    }
  },
  stopObserving() {
    window.removeEventListener(eventName, this._handleMotion);
  },
};
