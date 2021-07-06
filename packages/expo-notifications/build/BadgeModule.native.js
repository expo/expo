import { NativeModulesProxy } from '@unimodules/core';
export default {
    ...NativeModulesProxy.ExpoBadgeModule,
    // We overwrite setBadgeCountAsync to omit
    // an obsolete options argument when calling
    // the native function.
    setBadgeCountAsync: async (badgeCount, options) => {
        return await NativeModulesProxy.ExpoBadgeModule.setBadgeCountAsync(badgeCount);
    },
};
//# sourceMappingURL=BadgeModule.native.js.map