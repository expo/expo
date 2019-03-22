import { SyntheticPlatformEmitter } from '@unimodules/core';

const scalar = Math.PI / 180;
export default {
  get name(): string {
    return 'ExponentAccelerometer';
  },
  async isAvailableAsync(): Promise<boolean> {
    return typeof DeviceOrientationEvent !== 'undefined';
  },
  _handleMotion({ alpha, beta, gamma }) {
    SyntheticPlatformEmitter.emit('accelerometerDidUpdate', {
      x: gamma * scalar,
      y: beta * scalar,
      z: alpha * scalar,
    });
  },
  startObserving() {
    window.addEventListener('deviceorientation', this._handleMotion);
  },
  stopObserving() {
    window.removeEventListener('deviceorientation', this._handleMotion);
  },
};
