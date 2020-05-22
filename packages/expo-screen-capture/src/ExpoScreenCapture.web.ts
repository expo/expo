export default {
  get name(): string {
    return 'ExpoScreenCapture';
  },
  async preventScreenCapture(tag = 'default'): Promise<null> {
    return null;
  },
  async allowScreenCapture(tag = 'default'): Promise<null> {
    return null;
  },
  async usePreventScreenCapture(tag = 'default'): Promise<null> {
    return null;
  },
};
