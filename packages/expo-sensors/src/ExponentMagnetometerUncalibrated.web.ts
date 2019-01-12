import PlatformSensorModule from './PlatformSensorModule';

class ExponentMagnetometerUncalibrated extends PlatformSensorModule {
  get name(): string {
    return 'ExponentMagnetometerUncalibrated';
  }
}

export default new ExponentMagnetometerUncalibrated();
