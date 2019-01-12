import PlatformSensorModule from './PlatformSensorModule';

class ExponentAccelerometer extends PlatformSensorModule {
  get name(): string {
    return 'ExponentAccelerometer';
  }

  isAvailableAsync = async (): Promise<boolean> => {
    return !!DeviceMotionEvent;
  };

  _handleMotion = ({ accelerationIncludingGravity }) => {
    this.emitter.emit('accelerometerDidUpdate', {
      x: accelerationIncludingGravity.x,
      y: accelerationIncludingGravity.y,
      z: accelerationIncludingGravity.z,
    });
  };

  startObserving = () => {
    window.addEventListener('devicemotion', this._handleMotion);
  };

  stopObserving = () => {
    window.removeEventListener('devicemotion', this._handleMotion);
  };
}

export default new ExponentAccelerometer();
