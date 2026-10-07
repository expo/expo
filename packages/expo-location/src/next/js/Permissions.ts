import { createPermissionHook } from 'expo-modules-core';

import { getNativeLocationModuleNext } from '../native';
import type { LocationPermissionResponse, RequestPermissionsOptions } from '../types';

export async function getForegroundPermissions(): Promise<LocationPermissionResponse> {
  return getNativeLocationModuleNext().getForegroundPermissions();
}

export async function requestForegroundPermissions(
  options?: RequestPermissionsOptions
): Promise<LocationPermissionResponse> {
  return getNativeLocationModuleNext().requestForegroundPermissions(options);
}

export async function getBackgroundPermissions(): Promise<LocationPermissionResponse> {
  return getNativeLocationModuleNext().getBackgroundPermissions();
}

export async function requestBackgroundPermissions(
  options?: RequestPermissionsOptions
): Promise<LocationPermissionResponse> {
  return getNativeLocationModuleNext().requestBackgroundPermissions(options);
}

export const useForegroundLocationPermissions = createPermissionHook({
  getMethod: getForegroundPermissions,
  requestMethod: requestForegroundPermissions,
});

export const useBackgroundLocationPermissions = createPermissionHook({
  getMethod: getBackgroundPermissions,
  requestMethod: requestBackgroundPermissions,
});
