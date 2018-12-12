import PlatformModule from './PlatformModule';

class ExponentPedometer extends PlatformModule {
  get name(): string {
    return 'ExponentPedometer';
  }

  //   async getStepCountAsync(startTime: number, endTime: number) {}

  async isAvailableAsync(): Promise<Boolean> {
    return false;
  }
}

export default new ExponentPedometer();
