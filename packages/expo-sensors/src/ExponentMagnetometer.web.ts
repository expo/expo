export default {
  get name(): string {
    return 'ExponentMagnetometer';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
};
