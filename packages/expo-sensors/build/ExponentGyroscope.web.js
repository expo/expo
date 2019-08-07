import { SyntheticPlatformEmitter } from '@unimodules/core';
import { isSensorEnabledAsync } from './utils/isSensorEnabledAsync.web';
const eventName = 'devicemotion';
export default {
    get name() {
        return 'ExponentGyroscope';
    },
    async isAvailableAsync() {
        if (typeof DeviceMotionEvent === 'undefined') {
            return false;
        }
        return await isSensorEnabledAsync(eventName);
    },
    _handleMotion({ accelerationIncludingGravity }) {
        SyntheticPlatformEmitter.emit('gyroscopeDidUpdate', {
            x: accelerationIncludingGravity.x,
            y: accelerationIncludingGravity.y,
            z: accelerationIncludingGravity.z,
        });
    },
    startObserving() {
        window.addEventListener(eventName, this._handleMotion);
    },
    stopObserving() {
        window.removeEventListener(eventName, this._handleMotion);
    },
};
//# sourceMappingURL=ExponentGyroscope.web.js.map