import { UnavailabilityError } from '@unimodules/core';
export default {
    get DEFAULT_APP_NAME() {
        return '[DEFAULT]';
    },
    get DEFAULT_APP_OPTIONS() {
        throw new UnavailabilityError('expo-firebase-core', 'DEFAULT_APP_OPTIONS');
    },
};
//# sourceMappingURL=ExpoFirebaseCore.web.js.map