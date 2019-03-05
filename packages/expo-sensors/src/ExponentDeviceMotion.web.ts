import { SyntheticPlatformEmitter } from '@unimodules/core';

export default {
  get name(): string {
    return 'ExponentDeviceMotion';
  },
  get Gravity(): number {
    return 9.81;
  },
  async isAvailableAsync(): Promise<boolean> {
    return typeof DeviceMotionEvent !== 'undefined';
  },
  _handleMotion(motion) {
    // TODO: Bacon: Can rotation be calculated?
    SyntheticPlatformEmitter.emit('deviceMotionDidUpdate', {
      acceleration: motion.acceleration,
      accelerationIncludingGravity: motion.accelerationIncludingGravity,
      interval: motion.interval,
      rotationRate: motion.rotationRate,
      orientation: window.orientation,
    });
  },
  startObserving() {
    window.addEventListener('devicemotion', this._handleMotion);
  },
  stopObserving() {
    window.removeEventListener('devicemotion', this._handleMotion);
  },
};
