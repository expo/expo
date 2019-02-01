import { SyntheticPlatformEmitter } from 'expo-core';
export default {
    get name() {
        return 'ExponentGyroscope';
    },
    async isAvailableAsync() {
        return typeof DeviceOrientationEvent !== 'undefined';
    },
    _handleMotion({ alpha: z, beta: y, gamma: x }) {
        SyntheticPlatformEmitter.emit('gyroscopeDidUpdate', { x, y, z });
    },
    startObserving() {
        window.addEventListener('deviceorientation', this._handleMotion);
    },
    stopObserving() {
        window.removeEventListener('deviceorientation', this._handleMotion);
    },
};
//# sourceMappingURL=ExponentGyroscope.web.js.map