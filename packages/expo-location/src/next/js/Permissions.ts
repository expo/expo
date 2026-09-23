import { createPermissionHook } from 'expo-modules-core';

import { NativeLocationModuleNext } from '../native';
import type { LocationPermissionResponse, RequestPermissionsOptions } from '../types';

export async function getForegroundPermissionsAsync(): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.getForegroundPermissions();
}

export async function requestForegroundPermissionsAsync(
  options?: RequestPermissionsOptions
): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.requestForegroundPermissions(options);
}

export async function getBackgroundPermissionsAsync(): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.getBackgroundPermissions();
}

export async function requestBackgroundPermissionsAsync(
  options?: RequestPermissionsOptions
): Promise<LocationPermissionResponse> {
  return NativeLocationModuleNext.requestBackgroundPermissions(options);
}

export const useForegroundPermissions = createPermissionHook({
  getMethod: getForegroundPermissionsAsync,
  requestMethod: requestForegroundPermissionsAsync,
});

export const useBackgroundPermissions = createPermissionHook({
  getMethod: getBackgroundPermissionsAsync,
  requestMethod: requestBackgroundPermissionsAsync,
});
