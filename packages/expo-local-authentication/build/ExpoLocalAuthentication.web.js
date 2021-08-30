import { SecurityLevel } from './LocalAuthentication.types';
export default {
    get name() {
        return 'ExpoLocalAuthentication';
    },
    async hasHardwareAsync() {
        return false;
    },
    async isEnrolledAsync() {
        return false;
    },
    async getEnrolledLevelAsync() {
        return SecurityLevel.NONE;
    },
    async supportedAuthenticationTypesAsync() {
        return [];
    },
};
//# sourceMappingURL=ExpoLocalAuthentication.web.js.map