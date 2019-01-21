export default {
  get name(): string {
    return 'ExponentBarometer';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  startObserving() {},
  stopObserving() {},
};
