export default {
  get name() {
    return 'ExpoLocalAuthentication';
  },
  async hasHardwareAsync() {
    return false;
  },
  async cancelAuthenticate() {
    // TODO: Bacon: Add this
  },
  async authenticateAsync() {
    // TODO: Bacon: Add this
  },
  async isEnrolledAsync() {
    return false;
  },
  async supportedAuthenticationTypesAsync() {
    // TODO: Bacon: Add this
  },
};
