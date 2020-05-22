export default {
  get name(): string {
    return 'ExpoScreenCapture';
  },
  async preventScreenCapture(): Promise<null> {
    return null;
  },
  async allowScreenCapture(): Promise<null> {
    return null;
  },
  async usePreventScreenCapture(): Promise<null> {
    return null;
  },
};
