import { Platform } from 'expo-core';
import ExpoSMS from './ExpoSMS';
export async function sendSMSAsync(addresses, message) {
    const finalAddresses = Array.isArray(addresses) ? addresses : [addresses];
    if (!ExpoSMS.sendSMSAsync) {
        throw new Error(`SMS.sendSMSAsync is not supported on ${Platform.OS}`);
    }
    return ExpoSMS.sendSMSAsync(finalAddresses, message);
}
export async function isAvailableAsync() {
    return ExpoSMS.isAvailableAsync();
}
//# sourceMappingURL=SMS.js.map