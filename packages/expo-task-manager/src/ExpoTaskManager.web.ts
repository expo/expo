export default {
  get EVENT_NAME(): string {
    return 'TaskManager.executeTask';
  },
  addListener() {},
  removeListeners() {},
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
};
