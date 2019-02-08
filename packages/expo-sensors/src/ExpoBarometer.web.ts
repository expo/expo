export default {
  get name(): string {
    return 'ExpoBarometer';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  startObserving() {},
  stopObserving() {},
};
