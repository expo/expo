export default {
  get name(): string {
    return 'ExponentUpdates';
  },
  async reload(): Promise<void> {
    location.reload(true);
  },
  async reloadFromCache(): Promise<void> {
    location.reload(true);
  },
};
