import PlatformSensorModule from './PlatformSensorModule';

class ExponentMagnetometer extends PlatformSensorModule {
  get name(): string {
    return 'ExponentMagnetometer';
  }
}

export default new ExponentMagnetometer();
