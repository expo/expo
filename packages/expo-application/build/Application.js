import { Platform, UnavailabilityError } from '@unimodules/core';
import ExpoApplication from './ExpoApplication';
export const nativeApplicationVersion = ExpoApplication ? ExpoApplication.nativeApplicationVersion : null;
export const nativeBuildVersion = ExpoApplication ? ExpoApplication.nativeBuildVersion : null;
export const applicationName = ExpoApplication ? ExpoApplication.applicationName : null;
export const applicationId = ExpoApplication ? ExpoApplication.applicationId : null;
export let androidId;
if (Platform.OS === 'ios' || Platform.OS === 'web') {
    androidId = null;
}
else {
    androidId = ExpoApplication ? ExpoApplication.androidId : null;
}
export async function getInstallReferrerAsync() {
    if (!ExpoApplication.getInstallReferrerAsync) {
        throw new UnavailabilityError('expo-application', 'getInstallReferrerAsync');
    }
    return await ExpoApplication.getInstallReferrerAsync();
}
export async function getIosIdForVendorAsync() {
    if (!ExpoApplication.getIosIdForVendorAsync) {
        throw new UnavailabilityError('expo-application', 'getIosIdForVendorAsync');
    }
    return await ExpoApplication.getIosIdForVendorAsync();
}
export async function getInstallationTimeAsync() {
    if (!ExpoApplication.getInstallationTimeAsync) {
        throw new UnavailabilityError('expo-application', 'getInstallationTimeAsync');
    }
    let installationTime = await ExpoApplication.getInstallationTimeAsync();
    return new Date(installationTime);
}
export async function getLastUpdateTimeAsync() {
    if (!ExpoApplication.getLastUpdateTimeAsync) {
        throw new UnavailabilityError('expo-application', 'getLastUpdateTimeAsync');
    }
    let lastUpdateTime = await ExpoApplication.getLastUpdateTimeAsync();
    return new Date(lastUpdateTime);
}
//# sourceMappingURL=Application.js.map