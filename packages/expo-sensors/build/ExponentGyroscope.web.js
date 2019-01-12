import PlatformSensorModule from './PlatformSensorModule';
class ExponentGyroscope extends PlatformSensorModule {
    constructor() {
        super(...arguments);
        this.isAvailableAsync = async () => {
            return !!DeviceOrientationEvent;
        };
        this._handleMotion = ({ alpha: z, beta: y, gamma: x }) => {
            this.emitter.emit('gyroscopeDidUpdate', { x, y, z });
        };
        this.startObserving = () => {
            window.addEventListener('deviceorientation', this._handleMotion);
        };
        this.stopObserving = () => {
            window.removeEventListener('deviceorientation', this._handleMotion);
        };
    }
    get name() {
        return 'ExponentGyroscope';
    }
}
export default new ExponentGyroscope();
//# sourceMappingURL=ExponentGyroscope.web.js.map