import { Platform, UnavailabilityError } from 'expo-modules-core';

import { ApplicationReleaseType, PushNotificationServiceEnvironment } from './Application.types';
import ExpoApplication from './ExpoApplication';

// @needsAudit
/**
 * The human-readable version of the native application that may be displayed in the app store.
 * At time when native app is built, on Android, this is the version name set by `version`
 * in app config, and on iOS, the `Info.plist` value for `CFBundleShortVersionString`.
 * On web, this value is `null`.
 * @example
 * `"2.11.0"`
 */
export const nativeApplicationVersion: string | null = ExpoApplication
  ? ExpoApplication.nativeApplicationVersion || null
  : null;

// @needsAudit
/**
 * The internal build version of the native application that the app stores may use to distinguish
 * between different binaries. At the time when native app is built, On Android, this is the version
 * code set by `android.versionCode` in app config, and on iOS, the `Info.plist` value for
 * `CFBundleVersion` (set with `ios.buildNumber` value in app config in a standalone app).
 * On web, this value is `null`. The return type on Android and iOS is `string`.
 * @example
 * Android: `"114"`, iOS: `"2.11.0"`
 */
export const nativeBuildVersion: string | null = ExpoApplication
  ? ExpoApplication.nativeBuildVersion || null
  : null;

// @needsAudit
/**
 * The human-readable name of the application that is displayed with the app's icon on the device's
 * home screen or desktop. On Android and iOS, this value is a `string` unless the name could not be
 * retrieved, in which case this value will be `null`. On web this value is `null`.
 * @example
 * `"Expo"`, `"Yelp"`, `"Instagram"`
 */
export const applicationName: string | null = ExpoApplication
  ? ExpoApplication.applicationName || null
  : null;

// @needsAudit
/**
 * The ID of the application. On Android, this is the application ID. On iOS, this is the bundle ID.
 * On web, this is `null`.
 * @example
 * `"com.cocoacasts.scribbles"`, `"com.apple.Pages"`
 */
export const applicationId: string | null = ExpoApplication
  ? ExpoApplication.applicationId || null
  : null;

// @needsAudit
/**
 * Gets the value of [`Settings.Secure.ANDROID_ID`](https://developer.android.com/reference/android/provider/Settings.Secure.html#ANDROID_ID).
 * This is a hexadecimal `string` unique to each combination of app-signing key, user, and device.
 * The value may change if a factory reset is performed on the device or if an APK signing key changes.
 * For more information about how the platform handles `ANDROID_ID` in Android 8.0 (API level 26)
 * and higher, see [Android 8.0 Behavior Changes](https://developer.android.com/about/versions/oreo/android-8.0-changes.html#privacy-all).
 * On iOS and web, this function is unavailable.
 * > In versions of the platform lower than Android 8.0 (API level 26), this value remains constant
 * > for the lifetime of the user's device. See the [ANDROID_ID](https://developer.android.com/reference/android/provider/Settings.Secure.html#ANDROID_ID)
 * > official docs for more information.
 * @example
 * `"dd96dec43fb81c97"`
 * @platform android
 */
export function getAndroidId(): string {
  if (Platform.OS !== 'android') {
    throw new UnavailabilityError('expo-application', 'androidId');
  }
  return ExpoApplication.androidId;
}

// @needsAudit
/**
 * Gets the referrer URL of the installed app with the [`Install Referrer API`](https://developer.android.com/google/play/installreferrer)
 * from the Google Play Store. In practice, the referrer URL may not be a complete, absolute URL.
 * @return A `Promise` that fulfills with a `string` of the referrer URL of the installed app.
 *
 * @example
 * ```ts
 * await Application.getInstallReferrerAsync();
 * // "utm_source=google-play&utm_medium=organic"
 * ```
 * @platform android
 */
export async function getInstallReferrerAsync(): Promise<string> {
  if (!ExpoApplication.getInstallReferrerAsync) {
    throw new UnavailabilityError('expo-application', 'getInstallReferrerAsync');
  }
  return await ExpoApplication.getInstallReferrerAsync();
}

// @needsAudit
/**
 * Gets the iOS "identifier for vendor" ([IDFV](https://developer.apple.com/documentation/uikit/uidevice/1620059-identifierforvendor))
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
 * @example
 * ```ts
 * await Application.getIosIdForVendorAsync();
 * // "68753A44-4D6F-1226-9C60-0050E4C00067"
 * ```
 * @platform ios
 */
export async function getIosIdForVendorAsync(): Promise<string | null> {
  if (!ExpoApplication.getIosIdForVendorAsync) {
    throw new UnavailabilityError('expo-application', 'getIosIdForVendorAsync');
  }
  return await ExpoApplication.getIosIdForVendorAsync();
}

// @needsAudit
/**
 * Gets the iOS application release type.
 * @return A `Promise` which fulfills with an [`ApplicationReleaseType`](#applicationreleasetype).
 * @platform ios
 */
export async function getIosApplicationReleaseTypeAsync(): Promise<ApplicationReleaseType> {
  if (!ExpoApplication.getApplicationReleaseTypeAsync) {
    throw new UnavailabilityError('expo-application', 'getApplicationReleaseTypeAsync');
  }
  return await ExpoApplication.getApplicationReleaseTypeAsync();
}

// @needsAudit
/**
 * Gets the current [Apple Push Notification (APN)](https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment?language=objc)
 * service environment.
 * @return A `Promise` that fulfills with the string, either `'development'` or `'production'`,
 * based on the current APN environment, or `null` on the simulator as it does not support registering with APNs.
 * @platform ios
 */
export async function getIosPushNotificationServiceEnvironmentAsync(): Promise<PushNotificationServiceEnvironment> {
  if (!ExpoApplication.getPushNotificationServiceEnvironmentAsync) {
    throw new UnavailabilityError('expo-application', 'getPushNotificationServiceEnvironmentAsync');
  }
  return await ExpoApplication.getPushNotificationServiceEnvironmentAsync();
}

// @needsAudit
/**
 * Gets the time the app was installed onto the device, not counting subsequent updates. If the app
 * is uninstalled and reinstalled, this method returns the time the app was reinstalled.
 * - On Android, this method uses [`PackageInfo.firstInstallTime`](https://developer.android.com/reference/android/content/pm/PackageInfo.html#firstInstallTime).
 * - On iOS, this method uses the [`NSFileCreationDate`](https://developer.apple.com/documentation/foundation/nsfilecreationdate?language=objc)
 * of the app's document root directory.
 * - On web, this method returns `null`.
 *
 * @return A `Promise` that fulfills with a `Date` object that specifies the time the app
 * was installed on the device.
 *
 * @example
 * ```ts
 * await Application.getInstallationTimeAsync();
 * // 2019-07-18T18:08:26.121Z
 * ```
 */
export async function getInstallationTimeAsync(): Promise<Date> {
  if (!ExpoApplication.getInstallationTimeAsync) {
    throw new UnavailabilityError('expo-application', 'getInstallationTimeAsync');
  }
  const installationTime = await ExpoApplication.getInstallationTimeAsync();
  return new Date(installationTime);
}

// @needsAudit
/**
 * Gets the last time the app was updated from the Google Play Store.
 * @return A `Promise` that fulfills with a `Date` object that specifies the last time
 * the app was updated via the Google Play Store.
 *
 * @example
 * ```ts
 * await Application.getLastUpdateTimeAsync();
 * // 2019-07-18T21:20:16.887Z
 * ```
 * @platform android
 */
export async function getLastUpdateTimeAsync(): Promise<Date> {
  if (!ExpoApplication.getLastUpdateTimeAsync) {
    throw new UnavailabilityError('expo-application', 'getLastUpdateTimeAsync');
  }
  const lastUpdateTime = await ExpoApplication.getLastUpdateTimeAsync();
  return new Date(lastUpdateTime);
}

export { ApplicationReleaseType, PushNotificationServiceEnvironment };
