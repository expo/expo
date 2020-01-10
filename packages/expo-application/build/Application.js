import { UnavailabilityError } from '@unimodules/core';
import ExpoApplication from './ExpoApplication';
export const nativeApplicationVersion = ExpoApplication
    ? ExpoApplication.nativeApplicationVersion || null
    : null;
export const nativeBuildVersion = ExpoApplication
    ? ExpoApplication.nativeBuildVersion || null
    : null;
export const applicationName = ExpoApplication
    ? ExpoApplication.applicationName || null
    : null;
export const applicationId = ExpoApplication
    ? ExpoApplication.applicationId || null
    : null;
export const androidId = ExpoApplication ? ExpoApplication.androidId || null : null;
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
export var AppReleaseType;
(function (AppReleaseType) {
    AppReleaseType[AppReleaseType["UNKNOWN"] = 0] = "UNKNOWN";
    AppReleaseType[AppReleaseType["SIMULATOR"] = 1] = "SIMULATOR";
    AppReleaseType[AppReleaseType["ENTERPRISE"] = 2] = "ENTERPRISE";
    AppReleaseType[AppReleaseType["DEVELOPMENT"] = 3] = "DEVELOPMENT";
    AppReleaseType[AppReleaseType["ADHOC"] = 4] = "ADHOC";
    AppReleaseType[AppReleaseType["APPSTORE"] = 5] = "APPSTORE";
})(AppReleaseType || (AppReleaseType = {}));
export async function getIosAppReleaseTypeAsync() {
    if (!ExpoApplication.getAppReleaseTypeAsync) {
        throw new UnavailabilityError('expo-application', 'getAppReleaseTypeAsync');
    }
    return await ExpoApplication.getAppReleaseTypeAsync();
}
export async function getIosPushNotificationServiceEnvironmentAsync() {
    if (!ExpoApplication.getPushNotificationServiceEnvironmentAsync) {
        throw new UnavailabilityError('expo-application', 'getPushNotificationServiceEnvironmentAsync');
    }
    return await ExpoApplication.getPushNotificationServiceEnvironmentAsync();
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