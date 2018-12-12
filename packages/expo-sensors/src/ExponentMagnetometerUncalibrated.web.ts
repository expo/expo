import PlatformModule from './PlatformModule';

class ExponentMagnetometerUncalibrated extends PlatformModule {
  get name(): string {
    return 'ExponentMagnetometerUncalibrated';
  }
}

export default new ExponentMagnetometerUncalibrated();
