import { UnavailabilityError } from '@unimodules/core';
export default {
    get name() {
        return 'ExpoSharing';
    },
    isAvailableAsync() {
        return Promise.resolve(!!navigator.share);
    },
    async shareAsync(url, options = {}) {
        const sharingNavigator = navigator;
        // NOTE: `navigator.share` is only available via HTTPS
        if (sharingNavigator.share) {
            return await sharingNavigator.share({ ...options, url });
        }
        else {
            throw new UnavailabilityError('navigator', 'share');
        }
    },
};
//# sourceMappingURL=ExpoSharing.web.js.map