import { Platform } from 'expo-core';
import ExpoSMS from './ExpoSMS';
export async function sendSMSAsync(addresses, message) {
    const finalAddresses = Array.isArray(addresses) ? addresses : [addresses];
    if (ExpoSMS.sendSMSAsync) {
        return ExpoSMS.sendSMSAsync(finalAddresses, message);
    }
    throw new Error(`SMS.sendSMSAsync is not supported on ${Platform.OS}`);
}
export async function isAvailableAsync() {
    return ExpoSMS.isAvailableAsync();
}
//# sourceMappingURL=SMS.js.map