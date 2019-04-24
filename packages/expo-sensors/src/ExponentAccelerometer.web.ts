import { SyntheticPlatformEmitter } from '@unimodules/core';
import {
  isSensorEnabledAsync,
  assertSensorEventEnabledAsync,
} from './utils/isSensorEnabledAsync.web';

const scalar = Math.PI / 180;
const eventName = 'deviceorientation';

export default {
  get name(): string {
    return 'ExponentAccelerometer';
  },
  async isAvailableAsync(): Promise<boolean> {
    if (typeof DeviceOrientationEvent === 'undefined') {
      return false;
    }
    return await isSensorEnabledAsync(eventName);
  },
  _handleMotion({ alpha, beta, gamma }) {
    SyntheticPlatformEmitter.emit('accelerometerDidUpdate', {
      x: gamma * scalar,
      y: beta * scalar,
      z: alpha * scalar,
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
