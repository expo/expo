import PlatformModule from './PlatformModule';
class ExponentGyroscope extends PlatformModule {
    constructor() {
        super(...arguments);
        this.isAvailableAsync = async () => {
            return DeviceOrientationEvent !== undefined;
        };
        this._handleMotion = ({ alpha: z, beta: y, gamma: x }) => {
            this.emitter.emit('gyroscopeDidUpdate', { x, y, z });
        };
        this.startObserving = () => {
            window.addEventListener('deviceorientation', this._handleMotion, true);
        };
        this.stopObserving = () => {
            window.removeEventListener('deviceorientation', this._handleMotion, true);
        };
    }
    get name() {
        return 'ExponentGyroscope';
    }
}
export default new ExponentGyroscope();
//# sourceMappingURL=ExponentGyroscope.web.js.map