import PlatformModule from './PlatformModule';
class ExponentDeviceMotion extends PlatformModule {
    constructor() {
        super(...arguments);
        this.isAvailableAsync = async () => {
            return DeviceMotionEvent !== undefined;
        };
        this._handleMotion = ({ acceleration, accelerationIncludingGravity, rotationRate }) => {
            this.emitter.emit('deviceMotionDidUpdate', {
                acceleration,
                accelerationIncludingGravity,
                rotationRate,
                // // https://stackoverflow.com/a/5493592/4047926
                // rotation: {
                //   alpha: undefined,
                //   beta: undefined,
                //   gamma: undefined,
                // },
                orientation: window.orientation,
            });
        };
        this.startObserving = () => {
            window.addEventListener('devicemotion', this._handleMotion, true);
        };
        this.stopObserving = () => {
            window.removeEventListener('devicemotion', this._handleMotion, true);
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