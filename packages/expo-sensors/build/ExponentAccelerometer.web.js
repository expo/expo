import { SyntheticPlatformEmitter } from '@unimodules/core';
import { isSensorEnabledAsync, guardSensorEventEnabledAsync, } from './utils/isSensorEnabledAsync.web';
const scalar = Math.PI / 180;
const eventName = 'deviceorientation';
export default {
    get name() {
        return 'ExponentAccelerometer';
    },
    async isAvailableAsync() {
        const isTypeAvailable = typeof DeviceOrientationEvent !== 'undefined';
        const isSensorEnabled = await isSensorEnabledAsync(eventName);
        return isTypeAvailable && isSensorEnabled;
    },
    _handleMotion({ alpha, beta, gamma }) {
        SyntheticPlatformEmitter.emit('accelerometerDidUpdate', {
            x: gamma * scalar,
            y: beta * scalar,
            z: alpha * scalar,
        });
    },
    async startObserving() {
        window.addEventListener(eventName, this._handleMotion);
        try {
            await guardSensorEventEnabledAsync(eventName);
        }
        catch (error) {
            this.stopObserving();
            throw error;
        }
    },
    stopObserving() {
        window.removeEventListener(eventName, this._handleMotion);
    },
};
//# sourceMappingURL=ExponentAccelerometer.web.js.map