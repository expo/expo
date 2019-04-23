import { SyntheticPlatformEmitter } from '@unimodules/core';
import {
  isSensorEnabledAsync,
  guardSensorEventEnabledAsync,
} from './utils/isSensorEnabledAsync.web';

const eventName = 'devicemotion';

export default {
  get name(): string {
    return 'ExponentDeviceMotion';
  },
  get Gravity(): number {
    return 9.81;
  },
  async isAvailableAsync(): Promise<boolean> {
    const isTypeAvailable = typeof DeviceMotionEvent !== 'undefined';
    const isSensorEnabled = await isSensorEnabledAsync(eventName);
    return isTypeAvailable && isSensorEnabled;
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
  async startObserving(): Promise<void> {
    window.addEventListener(eventName, this._handleMotion);
    try {
      await guardSensorEventEnabledAsync(eventName);
    } catch (error) {
      this.stopObserving();
      throw error;
    }
  },
  stopObserving() {
    window.removeEventListener(eventName, this._handleMotion);
  },
};
