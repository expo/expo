import { Platform } from '@unimodules/core';

export default {
  get name(): string {
    return 'ExponentUpdates';
  },
  async reload(): Promise<void> {
    if (!Platform.isDOMAvailable) {
      return;
    }
    location.reload(true);
  },
  async reloadFromCache(): Promise<void> {
    if (!Platform.isDOMAvailable) {
      return;
    }
    location.reload(true);
  },
};
