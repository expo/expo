import { UnavailabilityError } from '@unimodules/core';

type ShareOptions = { title?: string; text?: string; url?: string };

type NavigatorShare = (options: ShareOptions) => Promise<{}>;

interface Navigator {
  share?: NavigatorShare;
}

export default {
  get name(): string {
    return 'ExpoSharing';
  },
  isAvailableAsync(): Promise<boolean> {
    return Promise.resolve(!!(navigator as Navigator).share);
  },
  async shareAsync(url: string, options: ShareOptions = {}): Promise<{}> {
    const sharingNavigator: Navigator = navigator as Navigator;

    // NOTE: `navigator.share` is only available via HTTPS
    if (sharingNavigator.share) {
      return await sharingNavigator.share({ ...options, url });
    } else {
      throw new UnavailabilityError('navigator', 'share');
    }
  },
};
