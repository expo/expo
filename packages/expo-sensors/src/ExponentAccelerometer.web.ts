import PlatformModule from './PlatformModule';

class ExponentAccelerometer extends PlatformModule {
  get name(): string {
    return 'ExponentAccelerometer';
  }

  handleMotion({ accelerationIncludingGravity }) {
    this.emitter.emit('accelerometerDidUpdate', {
      x: accelerationIncludingGravity.alpha,
      y: accelerationIncludingGravity.beta,
      z: accelerationIncludingGravity.gamma,
    });
  }

  startObserving() {
    window.addEventListener('devicemotion', this.handleMotion, true);
  }

  stopObserving() {
    window.removeEventListener('devicemotion', this.handleMotion, true);
  }
}

export default new ExponentAccelerometer();
