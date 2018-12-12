import PlatformModule from './PlatformModule';

class ExponentDeviceMotion extends PlatformModule {
  get name(): string {
    return 'ExponentDeviceMotion';
  }

  get Gravity() {
    return 9;
  }
}

export default new ExponentDeviceMotion();
