import GlobalPlatformEmitter from './GlobalPlatformEmitter';
export default {
    get name() {
        return 'ExponentAccelerometer';
    },
    async isAvailableAsync() {
        return typeof DeviceMotionEvent !== 'undefined';
    },
    _handleMotion({ accelerationIncludingGravity }) {
        GlobalPlatformEmitter.emit('accelerometerDidUpdate', {
            x: accelerationIncludingGravity.x,
            y: accelerationIncludingGravity.y,
            z: accelerationIncludingGravity.z,
        });
    },
    startObserving() {
        window.addEventListener('devicemotion', this._handleMotion);
    },
    stopObserving() {
        window.removeEventListener('devicemotion', this._handleMotion);
    },
};
//# sourceMappingURL=ExponentAccelerometer.web.js.map