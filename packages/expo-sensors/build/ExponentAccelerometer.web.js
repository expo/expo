import PlatformModule from './PlatformModule';
class ExponentAccelerometer extends PlatformModule {
    constructor() {
        super(...arguments);
        this.isAvailableAsync = async () => {
            return DeviceMotionEvent !== undefined;
        };
        this._handleMotion = ({ accelerationIncludingGravity }) => {
            this.emitter.emit('accelerometerDidUpdate', {
                x: accelerationIncludingGravity.x,
                y: accelerationIncludingGravity.y,
                z: accelerationIncludingGravity.z,
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
        return 'ExponentAccelerometer';
    }
}
export default new ExponentAccelerometer();
//# sourceMappingURL=ExponentAccelerometer.web.js.map