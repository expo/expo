import { createPermissionHook, PermissionResponse } from 'expo-modules-core';

import { BarcodeScanningResult, BarcodeType } from './Camera.types';
import CameraManager from './ExpoCameraManager';

export { default as CameraView } from './CameraView';

// @needsAudit
/**
 * Checks user's permissions for accessing camera.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
async function getCameraPermissionsAsync(): Promise<PermissionResponse> {
  return CameraManager.getCameraPermissionsAsync();
}

// @needsAudit
/**
 * Asks the user to grant permissions for accessing camera.
 * On iOS this will require apps to specify an `NSCameraUsageDescription` entry in the **Info.plist**.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
async function requestCameraPermissionsAsync(): Promise<PermissionResponse> {
  return CameraManager.requestCameraPermissionsAsync();
}

// @needsAudit
/**
 * Check or request permissions to access the camera.
 * This uses both `requestCameraPermissionsAsync` and `getCameraPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = useCameraPermissions();
 * ```
 */
export const useCameraPermissions = createPermissionHook({
  getMethod: getCameraPermissionsAsync,
  requestMethod: requestCameraPermissionsAsync,
});

// @needsAudit
/**
 * Checks user's permissions for accessing microphone.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
async function getMicrophonePermissionsAsync(): Promise<PermissionResponse> {
  return CameraManager.getMicrophonePermissionsAsync();
}

// @needsAudit
/**
 * Asks the user to grant permissions for accessing the microphone.
 * On iOS this will require apps to specify an `NSMicrophoneUsageDescription` entry in the **Info.plist**.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
async function requestMicrophonePermissionsAsync(): Promise<PermissionResponse> {
  return CameraManager.requestMicrophonePermissionsAsync();
}

// @needsAudit
/**
 * Check or request permissions to access the microphone.
 * This uses both `requestMicrophonePermissionsAsync` and `getMicrophonePermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Camera.useMicrophonePermissions();
 * ```
 */
export const useMicrophonePermissions = createPermissionHook({
  getMethod: getMicrophonePermissionsAsync,
  requestMethod: requestMicrophonePermissionsAsync,
});

/**
 * Scan bar codes from the image at the given URL.
 * @param url URL to get the image from.
 * @param barcodeTypes An array of bar code types. Defaults to all supported bar code types on
 * the platform.
 * > __Note:__ Only QR codes are supported on iOS.
 * On android, the barcode should take up the majority of the image for best results.
 * @return A possibly empty array of objects of the `BarcodeScanningResult` shape, where the type
 * refers to the barcode type that was scanned and the data is the information encoded in the barcode.
 */
export async function scanFromURLAsync(
  url: string,
  barcodeTypes: BarcodeType[] = ['qr']
): Promise<BarcodeScanningResult[]> {
  return CameraManager.scanFromURLAsync(url, barcodeTypes);
}

export * from './Camera.types';

/**
 * @hidden
 */
export const Camera = {
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  getMicrophonePermissionsAsync,
  requestMicrophonePermissionsAsync,
  scanFromURLAsync,
};
