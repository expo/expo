import PlatformModule from './PlatformModule';

class ExponentBarometer extends PlatformModule {
  get name(): string {
    return 'ExponentBarometer';
  }
}

export default new ExponentBarometer();
