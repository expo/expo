import PlatformModule from './PlatformModule';

class ExponentDeviceMotion extends PlatformModule {
  get name(): string {
    return 'ExponentDeviceMotion';
  }

  get Gravity() {
    return 9.81;
  }

  handleMotion(deviceMotion) {
    this.emitter.emit('deviceMotionDidUpdate', deviceMotion);
  }

  startObserving() {
    window.addEventListener('devicemotion', this.handleMotion, true);
  }

  stopObserving() {
    window.removeEventListener('devicemotion', this.handleMotion, true);
  }
}

export default new ExponentDeviceMotion();
