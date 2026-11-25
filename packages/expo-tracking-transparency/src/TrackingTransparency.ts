import {
  createPermissionHook,
  type PermissionResponse,
  PermissionStatus,
  type PermissionExpiration,
  type PermissionHookOptions,
  UnavailabilityError,
} from 'expo';
import { Platform } from 'react-native';

import ExpoTrackingTransparency from './ExpoTrackingTransparency';

/**
 * @deprecated Use [`getAdvertisingIdAsync()`](#getadvertisingidasync) instead. This function returns
 * the same value synchronously and blocks the JS thread until the native lookup returns.
 *
 * @return The advertising ID as a UUID `string`, or `null` in the cases listed for
 * [`getAdvertisingIdAsync()`](#getadvertisingidasync).
 */
export function getAdvertisingId(): string | null {
  const advertisingId = ExpoTrackingTransparency.getAdvertisingId();
  if (advertisingId === '00000000-0000-0000-0000-000000000000') {
    return null;
  }
  return advertisingId;
}

/**
 * Gets the advertising ID, a UUID string intended only for advertising, such as frequency capping,
 * attribution, conversion events, and fraud detection.
 *
 * Don't store the advertising ID. Call this function each time your app needs it, because users can
 * reset the ID or change their tracking permission at any time. Check the permission with
 * [`getTrackingPermissionsAsync()`](#gettrackingpermissionsasync).
 *
 * On Android, this is the [Android Advertising ID](https://developer.android.com/training/articles/ad-id).
 * On a device with multiple users, each user has their own ID.
 *
 * On iOS, this is the [IDFA](https://developer.apple.com/documentation/adsupport/asidentifiermanager/advertisingidentifier).
 * Your app must call [`requestTrackingPermissionsAsync()`](#requesttrackingpermissionsasync) first.
 *
 * @return A promise that resolves to the advertising ID as a UUID `string`, or `null`:
 * - On Android, when the user has enabled [Limit Ad Tracking](https://support.google.com/googleplay/android-developer/answer/6048248)
 * - On iOS, when the user has not granted tracking permission, when a profile or configuration
 *   restricts access to the identifier, or in the simulator
 *
 * @example
 * ```ts
 * await TrackingTransparency.getAdvertisingIdAsync();
 * // "E9228286-4C4E-4789-9D95-15827DCB291B"
 * ```
 */
export async function getAdvertisingIdAsync(): Promise<string | null> {
  const advertisingId = await ExpoTrackingTransparency.getAdvertisingIdAsync();
  if (advertisingId === '00000000-0000-0000-0000-000000000000') {
    return null;
  }
  return advertisingId;
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
 * advertising ID, and so on. On iOS, if the user denies this permission, any attempt to collect the
 * IDFA will return a string of 0s.
 *
 * The system remembers the user’s choice and doesn’t prompt again unless a user uninstalls and then
 * reinstalls the app on the device.
 *
 * On Android, this method always returns that the permission was granted.
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
 * On Android, this method always returns that the permission was granted.
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
 * advertising ID, and so on. On iOS, if the user denies this permission, any attempt to collect the
 * IDFA will return a string of 0s.
 *
 * The system remembers the user’s choice and doesn’t prompt again unless a user uninstalls and then
 * reinstalls the app on the device.
 *
 * On Android, this method always returns that the permission was granted.
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
 * @returns On devices where the Tracking Transparency API is unavailable,
 * the get and request permissions methods will always resolve to `granted`.
 */
export function isAvailable(): boolean {
  return Boolean(ExpoTrackingTransparency);
}

export {
  type PermissionResponse,
  PermissionStatus,
  type PermissionExpiration,
  type PermissionHookOptions,
};
