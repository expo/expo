// @flow

export default {
  get name(): string {
    return 'ExpoLocalAuthentication';
  },
  async hasHardwareAsync(): Promise<boolean> {
    return false;
  },
  async cancelAuthenticate(): Promise<void> {
    // TODO: Bacon: Add this
  },
  async authenticateAsync(): Promise<void> {
    // TODO: Bacon: Add this
  },
  async isEnrolledAsync(): Promise<boolean> {
    return false;
  },
  async supportedAuthenticationTypesAsync(): Promise<void> {
    // TODO: Bacon: Add this
  },
};
