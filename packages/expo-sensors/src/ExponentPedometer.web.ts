import PlatformSensorModule from './PlatformSensorModule';

class ExponentPedometer extends PlatformSensorModule {
  get name(): string {
    return 'ExponentPedometer';
  }
}

export default new ExponentPedometer();
