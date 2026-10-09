import { Platform, UnavailabilityError } from 'expo';
import type { PermissionResponse } from 'expo';
import { createPermissionHook } from 'expo-modules-core';

import { NativeLocationModuleNext } from '../native';
import type { LocationPermissionResponse, RequestPermissionsOptions } from '../types';

export async function getForegroundPermissions(): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.getForegroundPermissions();
}

export async function requestForegroundPermissions(
  options?: RequestPermissionsOptions
): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.requestForegroundPermissions(options);
}

export async function getBackgroundPermissions(): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.getBackgroundPermissions();
}

export async function requestBackgroundPermissions(
  options?: RequestPermissionsOptions
): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.requestBackgroundPermissions(options);
}

/**
 * Checks the user's permission for posting the notification shown by the location foreground
 * service. The service runs without it — only its notification stays hidden.
 * @return A promise that fulfills with an object of type `PermissionResponse`.
 * @platform android
 */
export async function getNotificationPermissions(): Promise<PermissionResponse> {
  if (Platform.OS !== 'android') {
    throw new UnavailabilityError('expo-location', 'getNotificationPermissions');
  }

  return NativeLocationModuleNext.getNotificationPermissions();
}

/**
 * Asks the user to grant the permission for posting the notification shown by the location
 * foreground service. The service runs without it — only its notification stays hidden.
 * @return A promise that fulfills with an object of type `PermissionResponse`.
 * @platform android
 */
export async function requestNotificationPermissions(): Promise<PermissionResponse> {
  if (Platform.OS !== 'android') {
    throw new UnavailabilityError('expo-location', 'requestNotificationPermissions');
  }

  return NativeLocationModuleNext.requestNotificationPermissions();
}

export const useForegroundLocationPermissions = createPermissionHook({
  getMethod: getForegroundPermissions,
  requestMethod: requestForegroundPermissions,
});

export const useBackgroundLocationPermissions = createPermissionHook({
  getMethod: getBackgroundPermissions,
  requestMethod: requestBackgroundPermissions,
});

/**
 * Check or request the permission for the notification shown by the location foreground service.
 * This uses both `getNotificationPermissions` and `requestNotificationPermissions`.
 * @platform android
 */
export const useNotificationPermissions = createPermissionHook({
  getMethod: getNotificationPermissions,
  requestMethod: requestNotificationPermissions,
});
