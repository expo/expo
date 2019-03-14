import { SyntheticPlatformEmitter } from '@unimodules/core';
const scalar = Math.PI / 180;
export default {
    get name() {
        return 'ExponentAccelerometer';
    },
    async isAvailableAsync() {
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
//# sourceMappingURL=ExponentAccelerometer.web.js.map