import { createPermissionHook } from 'expo-modules-core';

import { NativeLocationModuleNext } from '../native';
import type { LocationPermissionResponse, RequestPermissionsOptions } from '../types';

/**
 * Checks the foreground location permission without asking the user.
 *
 * @return A promise that resolves to the current permission, including its scope and accuracy.
 */
export async function getForegroundPermissions(): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.getForegroundPermissions();
}

/**
 * Asks the user for permission to read the location while the app is in the foreground.
 * Shows the system dialog only while the permission is undetermined; afterwards it resolves with
 * the current state, so check `canAskAgain` to know whether the user has to go to the system
 * settings.
 *
 * See [Request the precise location](#request-the-precise-location) and
 * [Handle a denied permission](#handle-a-denied-permission).
 *
 * @param options The accuracy to ask for.
 * @return A promise that resolves to the permission after the user answered.
 */
export async function requestForegroundPermissions(
  options?: RequestPermissionsOptions
): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.requestForegroundPermissions(options);
}

/**
 * Checks the background location permission without asking the user.
 *
 * @return A promise that resolves to the current permission. `scope` is `always` when it is
 *   granted.
 */
export async function getBackgroundPermissions(): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.getBackgroundPermissions();
}

/**
 * Asks the user for permission to read the location while the app is in the background.
 * On Android, it requires the foreground permission first. On iOS, answering
 * **Keep Only While Using** resolves with `status` `denied` and `scope` `whenInUse`.
 *
 * See [Request the background permission](#request-the-background-permission).
 *
 * @param options The accuracy to ask for
 * @return A promise that resolves to the permission after the user answered.
 */
export async function requestBackgroundPermissions(
  options?: RequestPermissionsOptions
): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.requestBackgroundPermissions(options);
}

/**
 * Checks or requests the foreground location permission from a component.
 * See [Request the precise location](#request-the-precise-location).
 *
 * @example
 * ```tsx
 * const [permission, requestPermission] = useForegroundLocationPermissions();
 *
 * if (!permission?.granted) {
 *   return <Button title="Allow location" onPress={requestPermission} />;
 * }
 * ```
 */
export const useForegroundLocationPermissions = createPermissionHook({
  getMethod: getForegroundPermissions,
  requestMethod: requestForegroundPermissions,
});

/**
 * Checks or requests the background location permission from a component.
 * See [Request the background permission](#request-the-background-permission).
 *
 * @example
 * ```tsx
 * const [foreground, requestForeground] = useForegroundLocationPermissions();
 * const [background, requestBackground] = useBackgroundLocationPermissions();
 *
 * if (!foreground?.granted) {
 *   return <Button title="Allow location" onPress={requestForeground} />;
 * }
 * if (background?.scope !== LocationScope.ALWAYS) {
 *   return <Button title="Allow background location" onPress={requestBackground} />;
 * }
 * ```
 */
export const useBackgroundLocationPermissions = createPermissionHook({
  getMethod: getBackgroundPermissions,
  requestMethod: requestBackgroundPermissions,
});
