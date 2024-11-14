import { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions } from 'expo-modules-core';
/**
 * Gets the advertising ID, a UUID string intended only for advertising. Use this string for
 * frequency capping, attribution, conversion events, estimating the number of unique users,
 * advertising fraud detection, and debugging.
 *
 * As a best practice, don't store the advertising ID. Instead, call this function each time your
 * app needs to use the advertising ID. Users can change whether they allow app tracking and can
 * reset their advertising ID at any time in their system settings. Check your app's authorization
 * using `getTrackingPermissionsAsync()` to determine the user's intent.
 *
 * On Android, this function returns the "Android Advertising ID"
 * ([AAID](https://developers.google.com/android/reference/com/google/android/gms/ads/identifier/AdvertisingIdClient.Info#public-string-getid)).
 * On Android devices that support multiple users, including guest users, it's possible for your app
 * to obtain different advertising IDs on the same device. These different IDs correspond to
 * different users who could be signed in on that device. See Google's documentation for more
 * information: [Get a user-resettable advertising
 * ID](https://developer.android.com/training/articles/ad-id).
 *
 * On iOS, this function returns the "Identifier for Advertisers"
 * ([IDFA](https://developer.apple.com/documentation/adsupport/asidentifiermanager/advertisingidentifier)),
 * a string that's unique to each device. On devices running iOS 14.5 and newer, your app must
 * request tracking authorization using `requestTrackingPermissionsAsync()` before it can get the
 * advertising identifier.
 *
 * @return Returns either a UUID `string` or `null`. It returns null in the following cases:
 * - On Android, when `isLimitAdTrackingEnabled()` is `true`
 * - In the iOS simulator, regardless of any settings
 * - On devices running iOS 14.5 and later if you haven't received permission using
 *   `requestTrackingPermissionsAsync()`
 * - On iOS, if you've requested permission and the user declines
 * - On iOS, when a profile or configuration restricts access to the advertising identifier, such as
 *   when the user has turned off the system-wide "Allow Apps to Request to Track" setting
 *
 * @example
 * ```ts
 * TrackingTransparency.getAdvertisingId();
 * // "E9228286-4C4E-4789-9D95-15827DCB291B"
 * ```
 */
export declare function getAdvertisingId(): string | null;
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
export declare function requestTrackingPermissionsAsync(): Promise<PermissionResponse>;
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
export declare function getTrackingPermissionsAsync(): Promise<PermissionResponse>;
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
export declare const useTrackingPermissions: (options?: PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
/**
 * Returns whether the TrackingTransparency API is available on the current device.
 *
 * @returns On devices where the Tracking Transparency API is unavailable,
 * the get and request permissions methods will always resolve to `granted`.
 */
export declare function isAvailable(): boolean;
export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions };
//# sourceMappingURL=TrackingTransparency.d.ts.map