export default {
  get name(): string {
    return 'ExpoScreenCapture';
  },
  async isAvailableAsync(): Promise<false> {
    return false;
  },
  async preventScreenCaptureAsync(tag = 'default'): Promise<null> {
    return null;
  },
  async allowScreenCaptureAsync(tag = 'default'): Promise<null> {
    return null;
  },
  async usePreventScreenCapture(tag = 'default'): Promise<null> {
    return null;
  },
};
