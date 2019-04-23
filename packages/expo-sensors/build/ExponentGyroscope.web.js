import { SyntheticPlatformEmitter } from '@unimodules/core';
import { isSensorEnabledAsync, guardSensorEventEnabledAsync, } from './utils/isSensorEnabledAsync.web';
const eventName = 'devicemotion';
export default {
    get name() {
        return 'ExponentGyroscope';
    },
    async isAvailableAsync() {
        const isTypeAvailable = typeof DeviceMotionEvent !== 'undefined';
        const isSensorEnabled = await isSensorEnabledAsync(eventName);
        return isTypeAvailable && isSensorEnabled;
    },
    _handleMotion({ accelerationIncludingGravity }) {
        SyntheticPlatformEmitter.emit('gyroscopeDidUpdate', {
            x: accelerationIncludingGravity.x,
            y: accelerationIncludingGravity.y,
            z: accelerationIncludingGravity.z,
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
//# sourceMappingURL=ExponentGyroscope.web.js.map