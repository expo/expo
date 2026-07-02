import { PermissionResponse } from 'expo-modules-core';
import { LocationPermissionResponse } from './Location.types';
/**
 * Checks user's permissions for accessing location while the app is in the foreground.
 * @return A promise that fulfills with an object of type [`LocationPermissionResponse`](#locationpermissionresponse).
 */
export declare function getForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
/**
 * Asks the user to grant permissions for location while the app is in the foreground.
 * @return A promise that fulfills with an object of type [`LocationPermissionResponse`](#locationpermissionresponse).
 */
export declare function requestForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
/**
 * Check or request permissions for the foreground location.
 * This uses both `requestForegroundPermissionsAsync` and `getForegroundPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Location.useForegroundPermissions();
 * ```
 */
export declare const useForegroundPermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [LocationPermissionResponse | null, () => Promise<LocationPermissionResponse>, () => Promise<LocationPermissionResponse>];
/**
 * Checks user's permissions for accessing location while the app is in the background.
 * @return A promise that fulfills with an object of type [`PermissionResponse`](#permissionresponse).
 */
export declare function getBackgroundPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Asks the user to grant permissions for location while the app is in the background.
 * On __Android 11 or higher__: this method will open the system settings page - before that happens
 * you should explain to the user why your application needs background location permission.
 * For example, you can use `Modal` component from `react-native` to do that.
 * > __Note__: Foreground permissions should be granted before asking for the background permissions
 * (your app can't obtain background permission without foreground permission).
 * @return A promise that fulfills with an object of type [`PermissionResponse`](#permissionresponse).
 */
export declare function requestBackgroundPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Check or request permissions for the background location.
 * This uses both `requestBackgroundPermissionsAsync` and `getBackgroundPermissionsAsync` to
 * interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Location.useBackgroundPermissions();
 * ```
 */
export declare const useBackgroundPermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
/**
 * Checks whether location services are enabled by the user.
 * @return A promise which fulfills to `true` if location services are enabled on the device,
 * or `false` if not.
 */
export declare function hasServicesEnabledAsync(): Promise<boolean>;
//# sourceMappingURL=Location.d.ts.map