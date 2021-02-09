export default {
  get name(): string {
    return 'ExpoScreenCapture';
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
