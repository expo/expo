import { PermissionResponse, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

let NativeModule: any = null;

if (Platform.OS === 'android') {
  NativeModule = requireNativeModule('ExpoGoogleMaps');
}

/**
 * Checks user's permissions for accessing location.
 * @return A promise that fulfills with an object of type [`PermissionResponse`](#permissionresponse).
 */
export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  return await NativeModule?.requestPermissionsAsync();
}

/**
 * Asks the user to grant permissions for location.
 * @return A promise that fulfills with an object of type [`PermissionResponse`](#permissionresponse).
 */
export async function getPermissionsAsync(): Promise<PermissionResponse> {
  return await NativeModule?.getPermissionsAsync();
}
