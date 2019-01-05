import PlatformModule from './PlatformModule';

class ExponentAccelerometer extends PlatformModule {
  get name(): string {
    return 'ExponentAccelerometer';
  }

  isAvailableAsync = async (): Promise<boolean> => {
    return DeviceMotionEvent !== undefined;
  };

  _handleMotion = ({ accelerationIncludingGravity }) => {
    this.emitter.emit('accelerometerDidUpdate', {
      x: accelerationIncludingGravity.x,
      y: accelerationIncludingGravity.y,
      z: accelerationIncludingGravity.z,
    });
  };

  startObserving = () => {
    window.addEventListener('devicemotion', this._handleMotion, true);
  };

  stopObserving = () => {
    window.removeEventListener('devicemotion', this._handleMotion, true);
  };
}

export default new ExponentAccelerometer();
