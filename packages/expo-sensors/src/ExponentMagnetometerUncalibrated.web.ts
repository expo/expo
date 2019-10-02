export default {
  get name(): string {
    return 'ExponentMagnetometerUncalibrated';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  startObserving() {},
  stopObserving() {},
};
