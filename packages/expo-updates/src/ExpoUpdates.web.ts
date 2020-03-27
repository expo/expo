export default {
  get name(): string {
    return 'ExpoUpdates';
  },
  async reload(): Promise<void> {
    location.reload(true);
  },
};
