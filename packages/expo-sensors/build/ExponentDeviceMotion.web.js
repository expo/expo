import { DeviceEventEmitter } from 'react-native';
import { assertSensorEventEnabledAsync, getPermissionsAsync, isSensorEnabledAsync, requestPermissionsAsync, } from './utils/isSensorEnabledAsync.web';
const eventName = 'devicemotion';
export default {
    /**
     * Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
     */
    get Gravity() {
        return 9.80665;
    },
    async isAvailableAsync() {
        if (typeof DeviceMotionEvent === 'undefined') {
            return false;
        }
        return await isSensorEnabledAsync(eventName);
    },
    _handleMotion(motion) {
        // TODO: Bacon: Can rotation be calculated?
        DeviceEventEmitter.emit('deviceMotionDidUpdate', {
            acceleration: motion.acceleration,
            accelerationIncludingGravity: motion.accelerationIncludingGravity,
            timestamp: motion.timeStamp / 1000,
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
//# sourceMappingURL=ExponentDeviceMotion.web.js.map