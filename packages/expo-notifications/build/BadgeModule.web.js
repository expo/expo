import * as badgin from 'badgin';
let lastSetBadgeCount = 0;
export default {
    addListener: () => { },
    removeListeners: () => { },
    getBadgeCountAsync: async () => {
        return lastSetBadgeCount;
    },
    setBadgeCountAsync: async (badgeCount, options) => {
        if (badgeCount > 0) {
            badgin.set(badgeCount, options);
        }
        else {
            badgin.clear();
        }
        lastSetBadgeCount = badgeCount;
        return true;
    },
};
//# sourceMappingURL=BadgeModule.web.js.map