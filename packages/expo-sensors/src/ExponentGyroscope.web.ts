import PlatformSensorModule from './PlatformSensorModule';

class ExponentGyroscope extends PlatformSensorModule {
  get name(): string {
    return 'ExponentGyroscope';
  }

  isAvailableAsync = async (): Promise<boolean> => {
    return !!DeviceOrientationEvent;
  };

  _handleMotion = ({ alpha: z, beta: y, gamma: x }) => {
    this.emitter.emit('gyroscopeDidUpdate', { x, y, z });
  };

  startObserving = () => {
    window.addEventListener('deviceorientation', this._handleMotion);
  };

  stopObserving = () => {
    window.removeEventListener('deviceorientation', this._handleMotion);
  };
}

export default new ExponentGyroscope();
