import {
  PermissionResponse,
  PermissionStatus,
  PermissionExpiration,
  PermissionHookOptions,
  UnavailabilityError,
  createPermissionHook,
} from 'expo-modules-core';
import { Platform } from 'react-native';

import ExpoTrackingTransparency from './ExpoTrackingTransparency';

/**
 * Gets the advertising ID, a UUID string which you only use for advertising. Use this string for frequency capping,
 * attribution, conversion events, estimating the number of unique users, advertising fraud detection, and debugging.
 *
 * As a best practice, don't store the advertising identifier value, call this function each time your app needs to
 * check the value of the ID instead. Users can change their authorization for tracking or reset their advertising ID at
 * any time in settings. Check your app's authorization using `getTrackingPermissionsAsync()` to determine the user's
 * intent.
 *
 * On Android, it returns the "Android Advertising ID" ([AAID](https://developers.google.com/android/reference/com/google/android/gms/ads/identifier/AdvertisingIdClient.Info#public-string-getid)).
 * On Android devices that support multiple users, including guest users, it's possible for your app to obtain different
 * advertising IDs on the same device. These different IDs correspond to different users who could be signed in on that
 * device.
 * See Google's documentation for more information: [Get a user-resettable advertising ID](https://developer.android.com/training/articles/ad-id)
 *
 * On iOS, it returns the "Identifier for Advertisers" ([IDFA](https://developer.apple.com/documentation/adsupport/asidentifiermanager/advertisingidentifier)),
 * a string that's unique to each device. On devices running iOS 14.5, your app must request tracking authorization
 * using `requestTrackingPermissionsAsync()` before it can get the advertising identifier.
 *
 * @return It returns either UUID `string`, or `null`. It returns null in the following cases:
 * - In iOS simulator, regardless of any settings
 * - On devices running iOS 14.5 and later, if you haven't requested authorization using `requestTrackingPermissionsAsync()`
 * - On iOS, if you've requested authorization and the user declines
 * - On iOS, when a profile or configuration restricts access to the advertising identifier
 * - On Android, when `isLimitAdTrackingEnabled()` is `true`
 *
 * @example
 * ```ts
 * TrackingTransparency.getAdvertisingId();
 * // "E9228286-4C4E-4789-9D95-15827DCB291B"
 * ```
 */
export function getAdvertisingId(): string | null {
  const advertisingId = ExpoTrackingTransparency.getAdvertisingId();
  if (advertisingId === '00000000-0000-0000-0000-000000000000') return null;
  return advertisingId;
}

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
 * @example `"dd96dec43fb81c97"`
 * @platform android
 */
export function getAndroidId(): string {
  if (Platform.OS !== 'android') {
    throw new UnavailabilityError('TrackingTransparency', 'androidId');
  }
  return ExpoTrackingTransparency.androidId;
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
 * @return A `string` specifying the app's vendor ID. Apps from the same vendor will return the
 * same ID. See Apple's documentation for more information about the vendor ID's semantics.
 *
 * @example
 * ```ts
 * TrackingTransparency.getIosIdForVendor();
 * // "68753A44-4D6F-1226-9C60-0050E4C00067"
 * ```
 * @platform ios
 */
export function getIosIdForVendor(): string | null {
  if (!ExpoTrackingTransparency.getIosIdForVendor) {
    throw new UnavailabilityError('TrackingTransparency', 'getIosIdForVendor');
  }
  return ExpoTrackingTransparency.getIosIdForVendor();
}

const androidAndWebPermissionsResponse: PermissionResponse = {
  granted: true,
  expires: 'never',
  canAskAgain: true,
  status: PermissionStatus.GRANTED,
};

/**
 * Requests the user to authorize or deny access to app-related data that can be used for tracking
 * the user or the device. Examples of data used for tracking include email address, device ID,
 * advertising ID, etc. On iOS 14.5 and above, if the user denies this permission, any attempt to
 * collect the IDFA will return a string of 0s.
 *
 * The system remembers the user’s choice and doesn’t prompt again unless a user uninstalls and then
 * reinstalls the app on the device.
 *
 * On Android, web, and iOS 13 and below, this method always returns that the permission was
 * granted.
 * @example
 * ```typescript
 * const { granted } = await requestTrackingPermissionsAsync();
 *
 * if (granted) {
 *   // Your app is authorized to track the user or their device
 * }
 * ```
 */
export async function requestTrackingPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS !== 'ios') {
    return Promise.resolve(androidAndWebPermissionsResponse);
  }

  if (!ExpoTrackingTransparency.requestPermissionsAsync) {
    throw new UnavailabilityError('TrackingTransparency', 'requestPermissionsAsync');
  }
  return await ExpoTrackingTransparency.requestPermissionsAsync();
}

/**
 * Checks whether or not the user has authorized the app to access app-related data that can be used
 * for tracking the user or the device. See `requestTrackingPermissionsAsync` for more details.
 *
 * On Android, web, and iOS 13 and below, this method always returns that the permission was
 * granted.
 *
 * @example
 * ```typescript
 * const { granted } = await getTrackingPermissionsAsync();
 *
 * if (granted) {
 *   // Your app is authorized to track the user or their device
 * }
 * ```
 */
export async function getTrackingPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS !== 'ios') {
    return Promise.resolve(androidAndWebPermissionsResponse);
  }

  if (!ExpoTrackingTransparency.getPermissionsAsync) {
    throw new UnavailabilityError('TrackingTransparency', 'getPermissionsAsync');
  }
  return await ExpoTrackingTransparency.getPermissionsAsync();
}

/**
 * Check or request the user to authorize or deny access to app-related data that can be used for tracking
 * the user or the device. Examples of data used for tracking include email address, device ID,
 * advertising ID, etc. On iOS 14.5 and above, if the user denies this permission, any attempt to
 * collect the IDFA will return a string of 0s.
 *
 * The system remembers the user’s choice and doesn’t prompt again unless a user uninstalls and then
 * reinstalls the app on the device.
 *
 * On Android, web, and iOS 13 and below, this method always returns that the permission was
 * granted.
 * @example
 * ```ts
 * const [status, requestPermission] = useTrackingPermissions();
 * ```
 */
export const useTrackingPermissions = createPermissionHook({
  getMethod: getTrackingPermissionsAsync,
  requestMethod: requestTrackingPermissionsAsync,
});

/**
 * Returns whether the TrackingTransparency API is available on the current device.
 *
 * @returns Currently this is `true` on iOS 14 and above only. On devices where the
 * Tracking Transparency API is unavailable, the get and request permissions methods will always
 * resolve to `granted`.
 */
export function isAvailable(): boolean {
  return (
    Platform.OS === 'ios' &&
    parseInt(Platform.Version.toString(), 10) >= 14 &&
    ExpoTrackingTransparency
  );
}

export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions };
