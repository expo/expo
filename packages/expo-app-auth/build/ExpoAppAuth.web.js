import { Platform } from '@unimodules/core';
export default {
    get name() {
        return 'ExpoAppAuth';
    },
    get OAuthRedirect() {
        return Platform.isDOMAvailable ? window.location.href : '';
    },
};
//# sourceMappingURL=ExpoAppAuth.web.js.map