export default {
  get name(): string {
    return 'ExpoStoreReview';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
};
