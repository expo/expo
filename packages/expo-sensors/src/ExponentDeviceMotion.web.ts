import PlatformSensorModule from './PlatformSensorModule';

class ExponentDeviceMotion extends PlatformSensorModule {
  get name(): string {
    return 'ExponentDeviceMotion';
  }

  get Gravity() {
    return 9.81;
  }

  isAvailableAsync = async (): Promise<boolean> => {
    return !!DeviceMotionEvent;
  };

  _handleMotion = motion => {
    this.emitter.emit('deviceMotionDidUpdate', {
      ...motion,
      orientation: window.orientation,
    });
  };

  startObserving = () => {
    window.addEventListener('devicemotion', this._handleMotion);
  };

  stopObserving = () => {
    window.removeEventListener('devicemotion', this._handleMotion);
  };
}

export default new ExponentDeviceMotion();
