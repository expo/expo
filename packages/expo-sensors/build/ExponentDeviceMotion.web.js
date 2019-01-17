import GlobalPlatformEmitter from './GlobalPlatformEmitter';
export default {
    get name() {
        return 'ExponentDeviceMotion';
    },
    get Gravity() {
        return 9.81;
    },
    async isAvailableAsync() {
        return typeof DeviceMotionEvent !== 'undefined';
    },
    _handleMotion(motion) {
        GlobalPlatformEmitter.emit('deviceMotionDidUpdate', {
            ...motion,
            orientation: window.orientation,
        });
    },
    startObserving() {
        window.addEventListener('devicemotion', this._handleMotion);
    },
    stopObserving() {
        window.removeEventListener('devicemotion', this._handleMotion);
    },
};
//# sourceMappingURL=ExponentDeviceMotion.web.js.map