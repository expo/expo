import {
  PermissionResponse,
  PermissionStatus,
  PermissionExpiration,
  PermissionHookOptions,
  createPermissionHook,
  UnavailabilityError,
} from 'expo-modules-core';
import { Platform } from 'react-native';

import ExpoAdsAdMob from './ExpoAdsAdMob';

export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions };

const androidPermissionsResponse: PermissionResponse = {
  granted: true,
  expires: 'never',
  canAskAgain: true,
  status: PermissionStatus.GRANTED,
};

export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS === 'android') {
    return Promise.resolve(androidPermissionsResponse);
  }

  if (!ExpoAdsAdMob.requestPermissionsAsync) {
    throw new UnavailabilityError('AdMod', 'requestPermissionsAsync');
  }
  return await ExpoAdsAdMob.requestPermissionsAsync();
}

export async function getPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS === 'android') {
    return Promise.resolve(androidPermissionsResponse);
  }

  if (!ExpoAdsAdMob.getPermissionsAsync) {
    throw new UnavailabilityError('AdMod', 'getPermissionsAsync');
  }
  return await ExpoAdsAdMob.getPermissionsAsync();
}

// @needsAudit
/**
 * Check or request permissions for AdMob.
 * This uses both `requestPermissionAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = AdsAdMob.usePermission();
 * ```
 */
export const usePermissions = createPermissionHook({
  getMethod: getPermissionsAsync,
  requestMethod: requestPermissionsAsync,
});

/**
 * Returns whether the AdMob API is enabled on the current device. This does not check the native configuration.
 *
 * @returns Async `boolean`, indicating whether the AdMob API is available on the current device. Currently this resolves `true` on iOS and Android only.
 */
export async function isAvailableAsync(): Promise<boolean> {
  return !!ExpoAdsAdMob.setTestDeviceIDAsync;
}

export async function setTestDeviceIDAsync(testDeviceID: string | null): Promise<void> {
  if (!ExpoAdsAdMob.setTestDeviceIDAsync) {
    throw new UnavailabilityError('expo-ads-admob', 'setTestDeviceIDAsync');
  }
  await ExpoAdsAdMob.setTestDeviceIDAsync(testDeviceID || '');
}
