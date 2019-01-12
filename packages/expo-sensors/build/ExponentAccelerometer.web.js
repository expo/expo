import PlatformSensorModule from './PlatformSensorModule';
class ExponentAccelerometer extends PlatformSensorModule {
    constructor() {
        super(...arguments);
        this.isAvailableAsync = async () => {
            return typeof DeviceMotionEvent !== 'undefined';
        };
        this._handleMotion = ({ accelerationIncludingGravity }) => {
            this.emitter.emit('accelerometerDidUpdate', {
                x: accelerationIncludingGravity.x,
                y: accelerationIncludingGravity.y,
                z: accelerationIncludingGravity.z,
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
        return 'ExponentAccelerometer';
    }
}
export default new ExponentAccelerometer();
//# sourceMappingURL=ExponentAccelerometer.web.js.map