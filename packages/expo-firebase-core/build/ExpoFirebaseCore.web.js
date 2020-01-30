import { UnavailabilityError } from '@unimodules/core';
export default {
    get DEFAULT_NAME() {
        return '[DEFAULT]';
    },
    get DEFAULT_OPTIONS() {
        throw new UnavailabilityError('expo-firebase-core', 'DEFAULT_OPTIONS');
    },
};
//# sourceMappingURL=ExpoFirebaseCore.web.js.map