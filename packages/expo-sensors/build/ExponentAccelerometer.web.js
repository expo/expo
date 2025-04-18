import { DeviceEventEmitter } from 'react-native';
import { assertSensorEventEnabledAsync, getPermissionsAsync, isSensorEnabledAsync, requestPermissionsAsync, } from './utils/isSensorEnabledAsync.web';
const scalar = Math.PI / 180;
const eventName = 'deviceorientation';
export default {
    async isAvailableAsync() {
        if (typeof DeviceOrientationEvent === 'undefined') {
            return false;
        }
        return await isSensorEnabledAsync(eventName);
    },
    _handleMotion({ alpha, beta, gamma, timeStamp }) {
        // Abort if data is missing from the event
        if (alpha === null || beta === null || gamma === null)
            return;
        DeviceEventEmitter.emit('accelerometerDidUpdate', {
            x: gamma * scalar,
            y: beta * scalar,
            z: alpha * scalar,
            timestamp: timeStamp / 1000,
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
//# sourceMappingURL=ExponentAccelerometer.web.js.map