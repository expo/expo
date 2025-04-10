import { PermissionExpiration, PermissionHookOptions, PermissionResponse, PermissionStatus } from 'expo-modules-core';
import { CameraPermissionResponse, ImagePickerErrorResult, ImagePickerOptions, ImagePickerResult, MediaLibraryPermissionResponse } from './ImagePicker.types';
/**
 * Checks user's permissions for accessing camera.
 * @return A promise that fulfills with an object of type [CameraPermissionResponse](#camerapermissionresponse).
 */
export declare function getCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
/**
 * Checks user's permissions for accessing photos.
 * @param writeOnly Whether to request write or read and write permissions. Defaults to `false`
 * @return A promise that fulfills with an object of type [MediaLibraryPermissionResponse](#medialibrarypermissionresponse).
 */
export declare function getMediaLibraryPermissionsAsync(writeOnly?: boolean): Promise<MediaLibraryPermissionResponse>;
/**
 * Asks the user to grant permissions for accessing camera. This does nothing on web because the
 * browser camera is not used.
 * @return A promise that fulfills with an object of type [CameraPermissionResponse](#camerarollpermissionresponse).
 */
export declare function requestCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
/**
 * Asks the user to grant permissions for accessing user's photo. This method does nothing on web.
 * @param writeOnly Whether to request write or read and write permissions. Defaults to `false`
 * @return A promise that fulfills with an object of type [MediaLibraryPermissionResponse](#medialibrarypermissionresponse).
 */
export declare function requestMediaLibraryPermissionsAsync(writeOnly?: boolean): Promise<MediaLibraryPermissionResponse>;
/**
 * Check or request permissions to access the media library.
 * This uses both `requestMediaLibraryPermissionsAsync` and `getMediaLibraryPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = ImagePicker.useMediaLibraryPermissions();
 * ```
 */
export declare const useMediaLibraryPermissions: (options?: PermissionHookOptions<{
    writeOnly?: boolean;
}> | undefined) => [MediaLibraryPermissionResponse | null, () => Promise<MediaLibraryPermissionResponse>, () => Promise<MediaLibraryPermissionResponse>];
/**
 * Check or request permissions to access the camera.
 * This uses both `requestCameraPermissionsAsync` and `getCameraPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = ImagePicker.useCameraPermissions();
 * ```
 */
export declare const useCameraPermissions: (options?: PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
/**
 * Android system sometimes kills the `MainActivity` after the `ImagePicker` finishes. When this
 * happens, we lose the data selected using the `ImagePicker`. However, you can retrieve the lost
 * data by calling `getPendingResultAsync`. You can test this functionality by turning on
 * `Don't keep activities` in the developer options.
 * @return
 * - **On Android:** a promise that resolves to an object of exactly same type as in
 * `ImagePicker.launchImageLibraryAsync` or `ImagePicker.launchCameraAsync` if the `ImagePicker`
 * finished successfully. Otherwise, an object of type [`ImagePickerErrorResult`](#imagepickerimagepickererrorresult).
 * - **On other platforms:** `null`
 */
export declare function getPendingResultAsync(): Promise<ImagePickerResult | ImagePickerErrorResult | null>;
/**
 * Display the system UI for taking a photo with the camera. Requires `Permissions.CAMERA`.
 * On Android and iOS 10 `Permissions.CAMERA_ROLL` is also required. On mobile web, this must be
 * called immediately in a user interaction like a button press, otherwise the browser will block
 * the request without a warning.
 * > **Note:** Make sure that you handle `MainActivity` destruction on **Android**. See [ImagePicker.getPendingResultAsync](#imagepickergetpendingresultasync).
 * > **Notes for Web:** The system UI can only be shown after user activation (e.g. a `Button` press).
 * Therefore, calling `launchCameraAsync` in `componentDidMount`, for example, will **not** work as
 * intended. The `cancelled` event will not be returned in the browser due to platform restrictions
 * and inconsistencies across browsers.
 * @param options An `ImagePickerOptions` object.
 * @return A promise that resolves to an object with `canceled` and `assets` fields.
 * When the user canceled the action the `assets` is always `null`, otherwise it's an array of
 * the selected media assets which have a form of [`ImagePickerAsset`](#imagepickerasset).
 */
export declare function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
/**
 * Display the system UI for choosing an image or a video from the phone's library.
 * Requires `Permissions.MEDIA_LIBRARY` on iOS 10 only. On mobile web, this must be     called
 * immediately in a user interaction like a button press, otherwise the browser will block the
 * request without a warning.
 *
 * **Animated GIFs support:** On Android, if the selected image is an animated GIF, the result image will be an
 * animated GIF too if and only if `quality` is explicitly set to `1.0` and `allowsEditing` is set to `false`.
 * Otherwise compression and/or cropper will pick the first frame of the GIF and return it as the
 * result (on Android the result will be a PNG). On iOS, both quality and cropping are supported.
 *
 * > **Notes for Web:** The system UI can only be shown after user activation (e.g. a `Button` press).
 * Therefore, calling `launchImageLibraryAsync` in `componentDidMount`, for example, will **not**
 * work as intended. The `cancelled` event will not be returned in the browser due to platform
 * restrictions and inconsistencies across browsers.
 * @param options An object extended by [`ImagePickerOptions`](#imagepickeroptions).
 * @return A promise that resolves to an object with `canceled` and `assets` fields.
 * When the user canceled the action the `assets` is always `null`, otherwise it's an array of
 * the selected media assets which have a form of [`ImagePickerAsset`](#imagepickerasset).
 */
export declare function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
export * from './ImagePicker.types';
export type { PermissionExpiration, PermissionHookOptions, PermissionResponse };
export { PermissionStatus };
//# sourceMappingURL=ImagePicker.d.ts.map