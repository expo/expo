import { SecurityLevel } from './LocalAuthentication.types';
export default {
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