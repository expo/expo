import PlatformModule from './PlatformModule';

class ExponentGyroscope extends PlatformModule {
  get name(): string {
    return 'ExponentGyroscope';
  }

  isAvailableAsync = async (): Promise<boolean> => {
    return DeviceOrientationEvent !== undefined;
  };

  _handleMotion = ({ alpha: z, beta: y, gamma: x }) => {
    this.emitter.emit('gyroscopeDidUpdate', { x, y, z });
  };

  startObserving = () => {
    window.addEventListener('deviceorientation', this._handleMotion, true);
  };

  stopObserving = () => {
    window.removeEventListener('deviceorientation', this._handleMotion, true);
  };
}

export default new ExponentGyroscope();
