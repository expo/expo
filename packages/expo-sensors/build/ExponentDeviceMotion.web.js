import PlatformSensorModule from './PlatformSensorModule';
class ExponentDeviceMotion extends PlatformSensorModule {
    constructor() {
        super(...arguments);
        this.isAvailableAsync = async () => {
            return !!DeviceMotionEvent;
        };
        this._handleMotion = motion => {
            this.emitter.emit('deviceMotionDidUpdate', {
                ...motion,
                orientation: window.orientation,
            });
        };
        this.startObserving = () => {
            window.addEventListener('devicemotion', this._handleMotion);
        };
        this.stopObserving = () => {
            window.removeEventListener('devicemotion', this._handleMotion);
        };
    }
    get name() {
        return 'ExponentDeviceMotion';
    }
    get Gravity() {
        return 9.81;
    }
}
export default new ExponentDeviceMotion();
//# sourceMappingURL=ExponentDeviceMotion.web.js.map