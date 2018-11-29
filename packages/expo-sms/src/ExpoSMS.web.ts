export default {
  get name(): string {
    return 'ExpoSMS';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
};
