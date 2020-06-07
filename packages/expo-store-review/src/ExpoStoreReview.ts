import { Platform } from '@unimodules/core';

export default {
  get name(): string {
    return 'ExpoStoreReview';
  },
  async isAvailableAsync(): Promise<boolean> {
    // true on Android, false on web
    return Platform.OS !== 'web';
  },
  // Unimplemented on web and Android
  requestReview: null as null | (() => Promise<void>),
};
