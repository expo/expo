import PlatformModule from './PlatformModule';

class ExponentGyroscope extends PlatformModule {
  get name(): string {
    return 'ExponentGyroscope';
  }
}

export default new ExponentGyroscope();
