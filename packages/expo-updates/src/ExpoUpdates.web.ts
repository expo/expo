import { Platform } from '@unimodules/core';

export default {
  get name(): string {
    return 'ExpoUpdates';
  },
  async reload(): Promise<void> {
    if (!Platform.isDOMAvailable) return;
    window.location.reload(true);
  },
};
