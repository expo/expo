import PlatformModule from './PlatformModule';

class ExponentAccelerometer extends PlatformModule {
  get name(): string {
    return 'ExponentAccelerometer';
  }
}

export default new ExponentAccelerometer();
