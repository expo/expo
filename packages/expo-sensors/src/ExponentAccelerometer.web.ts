import { SyntheticPlatformEmitter } from 'expo-core';

export default {
  get name(): string {
    return 'ExponentAccelerometer';
  },
  async isAvailableAsync(): Promise<boolean> {
    return typeof DeviceMotionEvent !== 'undefined';
  },
  _handleMotion({ accelerationIncludingGravity }) {
    SyntheticPlatformEmitter.emit('accelerometerDidUpdate', {
      x: accelerationIncludingGravity.x,
      y: accelerationIncludingGravity.y,
      z: accelerationIncludingGravity.z,
    });
  },
  startObserving() {
    window.addEventListener('devicemotion', this._handleMotion);
  },
  stopObserving() {
    window.removeEventListener('devicemotion', this._handleMotion);
  },
};
