import PlatformModule from './PlatformModule';

class ExponentMagnetometer extends PlatformModule {
  get name(): string {
    return 'ExponentMagnetometer';
  }
}

export default new ExponentMagnetometer();
