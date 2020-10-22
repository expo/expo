import { BadgeModule } from './BadgeModule.types';

let lastSetBadgeCount = 0;

const badgeModule: BadgeModule = {
  addListener: () => {},
  removeListeners: () => {},
  getBadgeCountAsync: async () => {
    return lastSetBadgeCount;
  },
  setBadgeCountAsync: async (badgeCount, options) => {
    // If this module is loaded in SSR (NextJS), we can't modify the badge.
    // It also can't load the badgin module, that instantly invokes methods on window.
    if (typeof window === 'undefined') {
      return false;
    }
    const badgin = require('badgin');
    if (badgeCount > 0) {
      badgin.set(badgeCount, options);
    } else {
      badgin.clear();
    }
    lastSetBadgeCount = badgeCount;
    return true;
  },
};

export default badgeModule;
