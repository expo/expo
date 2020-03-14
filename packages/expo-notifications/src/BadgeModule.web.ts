import * as badgin from 'badgin';

import { BadgeModule } from './BadgeModule.types';

let lastSetBadgeCount = 0;

export default {
  addListener: () => {},
  removeListeners: () => {},
  getBadgeCountAsync: async () => {
    return lastSetBadgeCount;
  },
  setBadgeCountAsync: async (badgeCount: number, options?: badgin.Options) => {
    if (badgeCount > 0) {
      badgin.set(badgeCount, options);
    } else {
      badgin.clear();
    }
    lastSetBadgeCount = badgeCount;
    return true;
  },
} as BadgeModule;
