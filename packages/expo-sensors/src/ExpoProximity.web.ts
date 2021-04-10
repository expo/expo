export default {
  get name(): string {
    return 'ExpoProximity';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  startObserving() {},
  stopObserving() {},
};
