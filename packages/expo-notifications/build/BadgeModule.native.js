import { requireNativeModule } from 'expo-modules-core';
const nativeModule = requireNativeModule('ExpoBadgeModule');
export default {
    ...nativeModule,
    // We overwrite setBadgeCountAsync to omit
    // an obsolete options argument when calling
    // the native function.
    setBadgeCountAsync: async (badgeCount, options) => {
        return await nativeModule.setBadgeCountAsync(badgeCount);
    },
};
//# sourceMappingURL=BadgeModule.native.js.map