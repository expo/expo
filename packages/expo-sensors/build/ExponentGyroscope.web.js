import { DeviceEventEmitter } from 'expo-modules-core';
import { assertSensorEventEnabledAsync, getPermissionsAsync, isSensorEnabledAsync, requestPermissionsAsync, } from './utils/isSensorEnabledAsync.web';
const eventName = 'devicemotion';
export default {
    async isAvailableAsync() {
        if (typeof DeviceMotionEvent === 'undefined') {
            return false;
        }
        return await isSensorEnabledAsync(eventName);
    },
    _handleMotion({ accelerationIncludingGravity }) {
        DeviceEventEmitter.emit('gyroscopeDidUpdate', {
            x: accelerationIncludingGravity.x,
            y: accelerationIncludingGravity.y,
            z: accelerationIncludingGravity.z,
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
//# sourceMappingURL=ExponentGyroscope.web.js.map