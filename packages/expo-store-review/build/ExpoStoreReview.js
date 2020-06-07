import { Platform } from '@unimodules/core';
export default {
    get name() {
        return 'ExpoStoreReview';
    },
    async isAvailableAsync() {
        // true on Android, false on web
        return Platform.OS !== 'web';
    },
    // Unimplemented on web and Android
    requestReview: null,
};
//# sourceMappingURL=ExpoStoreReview.js.map