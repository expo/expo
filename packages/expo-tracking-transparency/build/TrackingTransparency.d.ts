import { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions } from 'expo-modules-core';
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
 * @returns Currently this is `true` on iOS 14 and above only. On devices where the
 * Tracking Transparency API is unavailable, the get and request permissions methods will always
 * resolve to `granted`.
 */
export declare function isAvailable(): boolean;
export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions };
//# sourceMappingURL=TrackingTransparency.d.ts.map