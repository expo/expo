import { CodedError } from 'expo-modules-core';
export default {
    get name() {
        return 'ExpoSMS';
    },
    async isAvailableAsync() {
        return false;
    },
    async sendSMSAsync(addresses, message) {
        throw new CodedError('E_SMS_UNAVAILABLE', 'SMS not available');
    },
};
//# sourceMappingURL=ExpoSMS.web.js.map