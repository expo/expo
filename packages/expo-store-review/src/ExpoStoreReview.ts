// Unimplemented on web
export default {
  get name(): string {
    return 'ExpoStoreReview';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  requestReview: null as null | (() => Promise<void>),
};
