import { createPermissionHook, PermissionResponse } from 'expo-modules-core';

import ExpoLocation from './ExpoLocation';
import { LocationPermissionResponse } from './Location.types';

// @needsAudit
/**
 * Checks user's permissions for accessing location while the app is in the foreground.
 * @return A promise that fulfills with an object of type [`LocationPermissionResponse`](#locationpermissionresponse).
 */
export async function getForegroundPermissionsAsync(): Promise<LocationPermissionResponse> {
  return await ExpoLocation.getForegroundPermissionsAsync();
}

// @needsAudit
/**
 * Asks the user to grant permissions for location while the app is in the foreground.
 * @return A promise that fulfills with an object of type [`LocationPermissionResponse`](#locationpermissionresponse).
 */
export async function requestForegroundPermissionsAsync(): Promise<LocationPermissionResponse> {
  return await ExpoLocation.requestForegroundPermissionsAsync();
}

// @needsAudit
/**
 * Check or request permissions for the foreground location.
 * This uses both `requestForegroundPermissionsAsync` and `getForegroundPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Location.useForegroundPermissions();
 * ```
 */
export const useForegroundPermissions = createPermissionHook({
  getMethod: getForegroundPermissionsAsync,
  requestMethod: requestForegroundPermissionsAsync,
});

// @needsAudit
/**
 * Checks user's permissions for accessing location while the app is in the background.
 * @return A promise that fulfills with an object of type [`PermissionResponse`](#permissionresponse).
 */
export async function getBackgroundPermissionsAsync(): Promise<PermissionResponse> {
  return await ExpoLocation.getBackgroundPermissionsAsync();
}

// @needsAudit
/**
 * Asks the user to grant permissions for location while the app is in the background.
 * On __Android 11 or higher__: this method will open the system settings page - before that happens
 * you should explain to the user why your application needs background location permission.
 * For example, you can use `Modal` component from `react-native` to do that.
 * > __Note__: Foreground permissions should be granted before asking for the background permissions
 * (your app can't obtain background permission without foreground permission).
 * @return A promise that fulfills with an object of type [`PermissionResponse`](#permissionresponse).
 */
export async function requestBackgroundPermissionsAsync(): Promise<PermissionResponse> {
  return await ExpoLocation.requestBackgroundPermissionsAsync();
}

// @needsAudit
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
export const useBackgroundPermissions = createPermissionHook({
  getMethod: getBackgroundPermissionsAsync,
  requestMethod: requestBackgroundPermissionsAsync,
});

// --- Location service

// @needsAudit
/**
 * Checks whether location services are enabled by the user.
 * @return A promise which fulfills to `true` if location services are enabled on the device,
 * or `false` if not.
 */
export async function hasServicesEnabledAsync(): Promise<boolean> {
  return await ExpoLocation.hasServicesEnabledAsync();
}
