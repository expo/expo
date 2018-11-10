import { NativeModulesProxy } from 'expo-core';
const ExpoSMS = NativeModulesProxy.ExpoSMS;
export async function sendSMSAsync(addresses, message) {
    const finalAddresses = Array.isArray(addresses) ? addresses : [addresses];
    return ExpoSMS.sendSMSAsync(finalAddresses, message);
}
export async function isAvailableAsync() {
    return ExpoSMS.isAvailableAsync();
}
//# sourceMappingURL=SMS.js.map