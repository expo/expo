import { createPermissionHook } from 'expo-modules-core';
import CameraManager from '../ExponentCameraManager';
export { default as CameraView } from './CameraView';
// @needsAudit
/**
 * Checks user's permissions for accessing camera.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
async function getCameraPermissionsAsync() {
    return CameraManager.getCameraPermissionsAsync();
}
// @needsAudit
/**
 * Asks the user to grant permissions for accessing camera.
 * On iOS this will require apps to specify an `NSCameraUsageDescription` entry in the **Info.plist**.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
async function requestCameraPermissionsAsync() {
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
async function getMicrophonePermissionsAsync() {
    return CameraManager.getMicrophonePermissionsAsync();
}
// @needsAudit
/**
 * Asks the user to grant permissions for accessing the microphone.
 * On iOS this will require apps to specify an `NSMicrophoneUsageDescription` entry in the **Info.plist**.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
async function requestMicrophonePermissionsAsync() {
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
export * from './Camera.types';
export const Camera = {
    getCameraPermissionsAsync,
    requestCameraPermissionsAsync,
    getMicrophonePermissionsAsync,
    requestMicrophonePermissionsAsync,
};
//# sourceMappingURL=index.js.map