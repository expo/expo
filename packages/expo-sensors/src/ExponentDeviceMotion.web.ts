import PlatformModule from './PlatformModule';

class ExponentDeviceMotion extends PlatformModule {
  get name(): string {
    return 'ExponentDeviceMotion';
  }

  get Gravity() {
    return 9.81;
  }

  isAvailableAsync = async (): Promise<boolean> => {
    return DeviceMotionEvent !== undefined;
  };

  _handleMotion = ({ acceleration, accelerationIncludingGravity, rotationRate }) => {
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

  startObserving = () => {
    window.addEventListener('devicemotion', this._handleMotion, true);
  };

  stopObserving = () => {
    window.removeEventListener('devicemotion', this._handleMotion, true);
  };
}

export default new ExponentDeviceMotion();
