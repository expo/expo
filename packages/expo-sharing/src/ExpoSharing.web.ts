import { UnavailabilityError } from 'expo-modules-core';

type ShareOptions = { title?: string; text?: string; url?: string };

export default {
  get name(): string {
    return 'ExpoSharing';
  },
  async isAvailableAsync(): Promise<boolean> {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return !!navigator.share;
  },
  async shareAsync(url: string, options: ShareOptions = {}): Promise<void> {
    // NOTE: `navigator.share` is only available via HTTPS
    if (navigator.share) {
      await navigator.share({ ...options, url });
    } else {
      throw new UnavailabilityError('navigator', 'share');
    }
  },
};
