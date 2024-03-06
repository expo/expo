import { UnavailabilityError } from 'expo-modules-core';
export default {
    async isAvailableAsync() {
        if (typeof navigator === 'undefined') {
            return false;
        }
        return !!navigator.share;
    },
    async shareAsync(url, options = {}) {
        // NOTE: `navigator.share` is only available via HTTPS
        if (navigator.share) {
            await navigator.share({ ...options, url });
        }
        else {
            throw new UnavailabilityError('navigator', 'share');
        }
    },
};
//# sourceMappingURL=ExpoSharing.web.js.map