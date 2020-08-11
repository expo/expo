export default {
  get name(): string {
    return 'ExpoHaptics';
  },
  async isAvailableAsync(): Promise<false> {
    return false;
  },
};
