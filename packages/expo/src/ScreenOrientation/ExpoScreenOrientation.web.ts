export default {
  get name(): string {
    return 'ExpoScreenOrientation';
  },
  async doesSupportAsync(): Promise<Boolean> {
    return false;
  },
};
