import { PermissionResponse } from '../Camera.types';
export { default as CameraView } from './CameraView';
/**
 * Checks user's permissions for accessing camera.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
declare function getCameraPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Asks the user to grant permissions for accessing camera.
 * On iOS this will require apps to specify an `NSCameraUsageDescription` entry in the **Info.plist**.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
declare function requestCameraPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Check or request permissions to access the camera.
 * This uses both `requestCameraPermissionsAsync` and `getCameraPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = useCameraPermissions();
 * ```
 */
export declare const useCameraPermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
/**
 * Checks user's permissions for accessing microphone.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
declare function getMicrophonePermissionsAsync(): Promise<PermissionResponse>;
/**
 * Asks the user to grant permissions for accessing the microphone.
 * On iOS this will require apps to specify an `NSMicrophoneUsageDescription` entry in the **Info.plist**.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
declare function requestMicrophonePermissionsAsync(): Promise<PermissionResponse>;
/**
 * Check or request permissions to access the microphone.
 * This uses both `requestMicrophonePermissionsAsync` and `getMicrophonePermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Camera.useMicrophonePermissions();
 * ```
 */
export declare const useMicrophonePermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
export * from './Camera.types';
/**
 * @hidden
 */
export declare const Camera: {
    getCameraPermissionsAsync: typeof getCameraPermissionsAsync;
    requestCameraPermissionsAsync: typeof requestCameraPermissionsAsync;
    getMicrophonePermissionsAsync: typeof getMicrophonePermissionsAsync;
    requestMicrophonePermissionsAsync: typeof requestMicrophonePermissionsAsync;
};
//# sourceMappingURL=index.d.ts.map