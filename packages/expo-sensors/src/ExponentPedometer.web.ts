import PlatformModule from './PlatformModule';

class ExponentPedometer extends PlatformModule {
  get name(): string {
    return 'ExponentPedometer';
  }
}

export default new ExponentPedometer();
