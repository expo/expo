export default {
  get name(): string {
    return 'ExponentPedometer';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  startObserving() {},
  stopObserving() {},
};
