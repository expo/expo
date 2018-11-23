export default {
  get name() {
    return 'ExpoSMS';
  },
  async isAvailableAsync(options) {
    return false;
  },
};
