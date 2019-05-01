import { SyntheticPlatformEmitter } from '@unimodules/core';

import { isSensorEnabledAsync } from './utils/isSensorEnabledAsync.web';

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
  startObserving() {
    window.addEventListener(eventName, this._handleMotion);
  },
  stopObserving() {
    window.removeEventListener(eventName, this._handleMotion);
  },
};
