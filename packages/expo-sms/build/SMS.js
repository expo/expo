/* eslint-disable no-unused-expressions */
import { UnavailabilityError, Platform } from '@unimodules/core';
import ExpoSMS from './ExpoSMS';
function processAttachments(attachments) {
    if (!attachments) {
        return null;
    }
    attachments = Array.isArray(attachments) ? attachments : [attachments];
    if (Platform.OS === 'android' && attachments.length > 1) {
        if (__DEV__) {
            console.warn('Android only supports a single attachment. The first array item is used.');
        }
        attachments = attachments.slice(0, 1);
    }
    return attachments;
}
export async function sendSMSAsync(addresses, message, options) {
    if (!ExpoSMS.sendSMSAsync) {
        throw new UnavailabilityError('expo-sms', 'sendSMSAsync');
    }
    const finalAddresses = Array.isArray(addresses) ? addresses : [addresses];
    const finalOptions = {
        ...options,
    };
    if (options?.attachments) {
        finalOptions.attachments = processAttachments(options?.attachments) || undefined;
    }
    return ExpoSMS.sendSMSAsync(finalAddresses, message, finalOptions);
}
/**
 * The device has a telephony radio with data communication support.
 * - Always returns `false` in the iOS simulator, and browser
 */
export async function isAvailableAsync() {
    return ExpoSMS.isAvailableAsync();
}
//# sourceMappingURL=SMS.js.map