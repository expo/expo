import { UnavailabilityError } from '@unimodules/core';
import ExpoApplication from './ExpoApplication';
// @needsAudit
/**
 * The human-readable version of the native application that may be displayed in the app store.
 * This is the `Info.plist` value for `CFBundleShortVersionString` on iOS and the version name set
 * by `version` in `app.json` on Android at the time the native app was built.
 * On web, this value is `null`.
 * - E.g., `"2.11.0"`
 */
export const nativeApplicationVersion = ExpoApplication
    ? ExpoApplication.nativeApplicationVersion || null
    : null;
// @needsAudit
/**
 * The internal build version of the native application that the app store may use to distinguish
 * between different binaries. This is the `Info.plist` value for `CFBundleVersion` on iOS (set with
 * `ios.buildNumber` value in `app.json` in a standalone app) and the version code set by
 * `android.versionCode` in `app.json` on Android at the time the native app was built. On web, this
 * value is `null`. The return type on Android and iOS is `string`.
 * - E.g., iOS: `"2.11.0"`, Android: `"114"`
 */
export const nativeBuildVersion = ExpoApplication
    ? ExpoApplication.nativeBuildVersion || null
    : null;
// @needsAudit
/**
 * The human-readable name of the application that is displayed with the app's icon on the device's
 * home screen or desktop. On Android and iOS, this value is a `string` unless the name could not be
 * retrieved, in which case this value will be `null`. On web this value is `null`.
 * - E.g., `"Expo"`, `"Yelp"`, `"Instagram"`
 */
export const applicationName = ExpoApplication
    ? ExpoApplication.applicationName || null
    : null;
// @needsAudit
/**
 * The ID of the application. On Android, this is the application ID. On iOS, this is the bundle ID.
 * On web, this is `null`.
 * - E.g., `"com.cocoacasts.scribbles"`, `"com.apple.Pages"`
 */
export const applicationId = ExpoApplication
    ? ExpoApplication.applicationId || null
    : null;
// @needsAudit
/**
 * **Android only.** The value of [`Settings.Secure.ANDROID_ID`](https://developer.android.com/reference/android/provider/Settings.Secure.html#ANDROID_ID).
 * This is a hexadecimal `string` unique to each combination of app-signing key, user, and device.
 * The value may change if a factory reset is performed on the device or if an APK signing key changes.
 * For more information about how the platform handles `ANDROID_ID` in Android 8.0 (API level 26)
 * and higher, see [Android 8.0 Behavior Changes](https://developer.android.com/about/versions/oreo/android-8.0-changes.html#privacy-all).
 * On iOS and web, this value is `null`.
 * > In versions of the platform lower than Android 8.0 (API level 26), this value remains constant
 * > for the lifetime of the user's device. See the [ANDROID_ID](https://developer.android.com/reference/android/provider/Settings.Secure.html#ANDROID_ID)
 * > official docs for more information.
 * - E.g., `"dd96dec43fb81c97"`
 */
export const androidId = ExpoApplication ? ExpoApplication.androidId || null : null;
// @needsAudit
/**
 * **Android only.** Gets the referrer URL of the installed app with the [`Install Referrer API`](https://developer.android.com/google/play/installreferrer)
 * from the Google Play Store. In practice, the referrer URL may not be a complete, absolute URL.
 * @return A `Promise` that fulfills with a `string` of the referrer URL of the installed app.
 *
 * # Example
 * ```ts
 * await Application.getInstallReferrerAsync();
 * // "utm_source=google-play&utm_medium=organic"
 * ```
 */
export async function getInstallReferrerAsync() {
    if (!ExpoApplication.getInstallReferrerAsync) {
        throw new UnavailabilityError('expo-application', 'getInstallReferrerAsync');
    }
    return await ExpoApplication.getInstallReferrerAsync();
}
// @needsAudit
/**
 * **iOS only.** Gets the iOS "identifier for vendor" ([IDFV](https://developer.apple.com/documentation/uikit/uidevice/1620059-identifierforvendor))
 * value, a string ID that uniquely identifies a device to the app’s vendor. This method may
 * sometimes return `nil`, in which case wait and call the method again later. This might happen
 * when the device has been restarted before the user has unlocked the device.
 *
 * The OS will change the vendor identifier if all apps from the current app's vendor have been
 * uninstalled.
 *
 * @return A `Promise` that fulfills with a `string` specifying the app's vendor ID. Apps from the
 * same vendor will return the same ID. See Apple's documentation for more information about the
 * vendor ID's semantics.
 *
 * # Example
 * ```ts
 * await Application.getIosIdForVendorAsync();
 * // "68753A44-4D6F-1226-9C60-0050E4C00067"
 * ```
 */
export async function getIosIdForVendorAsync() {
    if (!ExpoApplication.getIosIdForVendorAsync) {
        throw new UnavailabilityError('expo-application', 'getIosIdForVendorAsync');
    }
    return (await ExpoApplication.getIosIdForVendorAsync()) ?? null;
}
// @docsMissing
export var ApplicationReleaseType;
(function (ApplicationReleaseType) {
    ApplicationReleaseType[ApplicationReleaseType["UNKNOWN"] = 0] = "UNKNOWN";
    ApplicationReleaseType[ApplicationReleaseType["SIMULATOR"] = 1] = "SIMULATOR";
    ApplicationReleaseType[ApplicationReleaseType["ENTERPRISE"] = 2] = "ENTERPRISE";
    ApplicationReleaseType[ApplicationReleaseType["DEVELOPMENT"] = 3] = "DEVELOPMENT";
    ApplicationReleaseType[ApplicationReleaseType["AD_HOC"] = 4] = "AD_HOC";
    ApplicationReleaseType[ApplicationReleaseType["APP_STORE"] = 5] = "APP_STORE";
})(ApplicationReleaseType || (ApplicationReleaseType = {}));
// @needsAudit
/**
 * **iOS only.** Gets the iOS application release type.
 * @return Returns a promise which fulfills with an [`ApplicationReleaseType`](#applicationreleasetype).
 */
export async function getIosApplicationReleaseTypeAsync() {
    if (!ExpoApplication.getApplicationReleaseTypeAsync) {
        throw new UnavailabilityError('expo-application', 'getApplicationReleaseTypeAsync');
    }
    return await ExpoApplication.getApplicationReleaseTypeAsync();
}
// @needsAudit
/**
 * **iOS only.** Gets the current [Apple Push Notification (APN)](https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment?language=objc)
 * service environment.
 * @return Returns a promise fulfilled with the string, either `'development'` or `'production'`,
 * based on the current APN environment.
 */
export async function getIosPushNotificationServiceEnvironmentAsync() {
    if (!ExpoApplication.getPushNotificationServiceEnvironmentAsync) {
        throw new UnavailabilityError('expo-application', 'getPushNotificationServiceEnvironmentAsync');
    }
    return await ExpoApplication.getPushNotificationServiceEnvironmentAsync();
}
// @needsAudit
/**
 * Gets the time the app was installed onto the device, not counting subsequent updates. If the app
 * is uninstalled and reinstalled, this method returns the time the app was reinstalled.
 * - On iOS, this method uses the [`NSFileCreationDate`](https://developer.apple.com/documentation/foundation/nsfilecreationdate?language=objc)
 * of the app's document root directory.
 * - On Android, this method uses [`PackageInfo.firstInstallTime`](https://developer.android.com/reference/android/content/pm/PackageInfo.html#firstInstallTime).
 * - On web, this method returns `null`.
 *
 * @return Returns a `Promise` that fulfills with a `Date` object that specifies the time the app
 * was installed on the device.
 *
 * # Example
 * ```ts
 * await Application.getInstallationTimeAsync();
 * // 2019-07-18T18:08:26.121Z
 * ```
 */
export async function getInstallationTimeAsync() {
    if (!ExpoApplication.getInstallationTimeAsync) {
        throw new UnavailabilityError('expo-application', 'getInstallationTimeAsync');
    }
    const installationTime = await ExpoApplication.getInstallationTimeAsync();
    return new Date(installationTime);
}
// @needsAudit
/**
 * **Android only.** Gets the last time the app was updated from the Google Play Store.
 * @return Returns a `Promise` that fulfills with a `Date` object that specifies the last time
 * the app was updated via the Google Play Store).
 *
 * # Example
 * ```ts
 * await Application.getLastUpdateTimeAsync();
 * // 2019-07-18T21:20:16.887Z
 * ```
 */
export async function getLastUpdateTimeAsync() {
    if (!ExpoApplication.getLastUpdateTimeAsync) {
        throw new UnavailabilityError('expo-application', 'getLastUpdateTimeAsync');
    }
    const lastUpdateTime = await ExpoApplication.getLastUpdateTimeAsync();
    return new Date(lastUpdateTime);
}
//# sourceMappingURL=Application.js.map