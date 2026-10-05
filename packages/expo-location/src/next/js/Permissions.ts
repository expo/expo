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

export const useForegroundPermissions = createPermissionHook({
  getMethod: getForegroundPermissions,
  requestMethod: requestForegroundPermissions,
});

export const useBackgroundPermissions = createPermissionHook({
  getMethod: getBackgroundPermissions,
  requestMethod: requestBackgroundPermissions,
});
