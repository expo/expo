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
    return 'ExponentDeviceMotion';
  },
  /**
   * Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
   */
  get Gravity(): number {
    return 9.80665;
  },
  async isAvailableAsync(): Promise<boolean> {
    if (typeof DeviceMotionEvent === 'undefined') {
      return false;
    }
    return await isSensorEnabledAsync(eventName);
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
