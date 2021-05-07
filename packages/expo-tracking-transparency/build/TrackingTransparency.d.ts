import { PermissionResponse } from 'unimodules-permissions-interface';
export * from './TrackingTransparency.types';
/**
 * Requests the user to authorize or deny access to app-related data that
 * can be used for tracking the user or the device. Examples of data used for tracking include
 * email address, device ID, advertising ID, etc.
 *
 * The system remembers the user’s choice and doesn’t prompt
 * again unless a user uninstalls and then reinstalls the app on the device.
 *
 *  *
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
 * Checks whether or not the user has authorized the app to access app-related data that
 * can be used for tracking the user or the device. See `requestPermissionsAsync` for more
 * details.
 *
 *  *
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
