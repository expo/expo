import PlatformModule from './PlatformModule';

class ExponentGyroscope extends PlatformModule {
  get name(): string {
    return 'ExponentGyroscope';
  }

  handleMotion({ alpha, beta, gamma }) {
    this.emitter.emit('gyroscopeDidUpdate', { alpha, beta, gamma });
  }

  startObserving() {
    window.addEventListener('deviceorientation', this.handleMotion, true);
  }

  stopObserving() {
    window.removeEventListener('deviceorientation', this.handleMotion, true);
  }
}

export default new ExponentGyroscope();
