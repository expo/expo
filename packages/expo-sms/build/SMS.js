import { UnavailabilityError } from '@unimodules/core';
import ExpoSMS from './ExpoSMS';
export async function sendSMSAsync(addresses, message) {
    const finalAddresses = Array.isArray(addresses) ? addresses : [addresses];
    if (!ExpoSMS.sendSMSAsync) {
        throw new UnavailabilityError('expo-sms', 'sendSMSAsync');
    }
    return ExpoSMS.sendSMSAsync(finalAddresses, message);
}
/**
 * The device has a telephony radio with data communication support.
 * - Always returns `false` in the iOS simulator, and browser
 */
export async function isAvailableAsync() {
    return ExpoSMS.isAvailableAsync();
}
//# sourceMappingURL=SMS.js.map