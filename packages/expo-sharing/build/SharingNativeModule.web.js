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
    getSharedPayloads() {
        throw new Error('Receiving share payloads is not supported on web.');
    },
    async getResolvedSharedPayloadsAsync() {
        throw new Error('Receiving share payloads is not supported on web.');
    },
    clearSharedPayloads() {
        throw new Error('Receiving share payloads is not supported on web.');
    },
};
//# sourceMappingURL=SharingNativeModule.web.js.map