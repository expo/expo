import PlatformSensorModule from './PlatformSensorModule';

class ExponentBarometer extends PlatformSensorModule {
  get name(): string {
    return 'ExponentBarometer';
  }
}

export default new ExponentBarometer();
