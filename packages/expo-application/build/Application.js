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
export var ApplicationReleaseType;
(function (ApplicationReleaseType) {
    ApplicationReleaseType[ApplicationReleaseType["UNKNOWN"] = 0] = "UNKNOWN";
    ApplicationReleaseType[ApplicationReleaseType["SIMULATOR"] = 1] = "SIMULATOR";
    ApplicationReleaseType[ApplicationReleaseType["ENTERPRISE"] = 2] = "ENTERPRISE";
    ApplicationReleaseType[ApplicationReleaseType["DEVELOPMENT"] = 3] = "DEVELOPMENT";
    ApplicationReleaseType[ApplicationReleaseType["AD_HOC"] = 4] = "AD_HOC";
    ApplicationReleaseType[ApplicationReleaseType["APP_STORE"] = 5] = "APP_STORE";
})(ApplicationReleaseType || (ApplicationReleaseType = {}));
export async function getIosApplicationReleaseTypeAsync() {
    if (!ExpoApplication.getApplicationReleaseTypeAsync) {
        throw new UnavailabilityError('expo-application', 'getApplicationReleaseTypeAsync');
    }
    return await ExpoApplication.getApplicationReleaseTypeAsync();
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
    const installationTime = await ExpoApplication.getInstallationTimeAsync();
    return new Date(installationTime);
}
export async function getLastUpdateTimeAsync() {
    if (!ExpoApplication.getLastUpdateTimeAsync) {
        throw new UnavailabilityError('expo-application', 'getLastUpdateTimeAsync');
    }
    const lastUpdateTime = await ExpoApplication.getLastUpdateTimeAsync();
    return new Date(lastUpdateTime);
}
//# sourceMappingURL=Application.js.map