import { Platform } from '@unimodules/core';

export default {
  get name(): string {
    return 'ExpoStoreReview';
  },
  async isAvailableAsync(): Promise<boolean> {
    // true on Android, false on web
    return Platform.OS === 'android';
  },
  // Unimplemented on web and Android
  requestReview: null as null | (() => Promise<void>),
};
