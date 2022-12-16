export default {
  get name(): string {
    return 'ExpoLightSensor';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  startObserving() {},
  stopObserving() {},
};
