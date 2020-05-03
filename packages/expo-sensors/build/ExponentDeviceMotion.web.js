import { SyntheticPlatformEmitter } from '@unimodules/core';
import { isSensorEnabledAsync, assertSensorEventEnabledAsync, } from './utils/isSensorEnabledAsync.web';
const eventName = 'devicemotion';
export default {
    get name() {
        return 'ExponentDeviceMotion';
    },
    get Gravity() {
        return 9.81;
    },
    async isAvailableAsync() {
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
    startObserving() {
        assertSensorEventEnabledAsync(eventName);
        window.addEventListener(eventName, this._handleMotion);
    },
    stopObserving() {
        window.removeEventListener(eventName, this._handleMotion);
    },
};
//# sourceMappingURL=ExponentDeviceMotion.web.js.map