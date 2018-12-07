export default {
  get name(): string {
    return 'ExponentScreenOrientation';
  },
  async doesSupportAsync(): Promise<Boolean> {
    return false;
  },
};
