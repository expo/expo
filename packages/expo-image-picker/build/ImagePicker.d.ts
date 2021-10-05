import { PermissionStatus, PermissionExpiration, PermissionHookOptions } from 'expo-modules-core';
import { CameraPermissionResponse, CameraRollPermissionResponse, MediaLibraryPermissionResponse, ImagePickerResult, ImagePickerErrorResult, MediaTypeOptions, ImagePickerOptions, VideoExportPreset, ExpandImagePickerResult, ImageInfo, ImagePickerMultipleResult, ImagePickerCancelledResult, OpenFileBrowserOptions, UIImagePickerControllerQualityType, UIImagePickerPresentationStyle } from './ImagePicker.types';
/**
 * Checks user's permissions for accessing camera.
 * @return A promise that fulfills with an object of type [CameraPermissionResponse](#imagepickercamerapermissionresponse).
 */
export declare function getCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
/**
 * @deprecated Use `getMediaLibraryPermissionsAsync()` instead.
 */
export declare function getCameraRollPermissionsAsync(): Promise<MediaLibraryPermissionResponse>;
/**
 * Checks user's permissions for accessing photos.
 * @param writeOnly Whether to request write or read and write permissions. Defaults to `false`
 * @return A promise that fulfills with an object of type [MediaLibraryPermissionResponse](#imagepickercamerarollpermissionresponse).
 */
export declare function getMediaLibraryPermissionsAsync(writeOnly?: boolean): Promise<MediaLibraryPermissionResponse>;
/**
 * Asks the user to grant permissions for accessing camera. This does nothing on web because the
 * browser camera is not used.
 * @return A promise that fulfills with an object of type [CameraPermissionResponse](#imagepickercamerapermissionresponse).
 */
export declare function requestCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
/**
 * @deprecated Use `requestMediaLibraryPermissionsAsync()` instead.
 */
export declare function requestCameraRollPermissionsAsync(): Promise<MediaLibraryPermissionResponse>;
/**
 * Asks the user to grant permissions for accessing user's photo. This method does nothing on web.
 * @param writeOnly Whether to request write or read and write permissions. Defaults to `false`
 * @return A promise that fulfills with an object of type [MediaLibraryPermissionResponse](#imagepickercamerarollpermissionresponse).
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
    writeOnly?: boolean | undefined;
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
export declare const useCameraPermissions: (options?: PermissionHookOptions<object> | undefined) => [import("expo-modules-core").PermissionResponse | null, () => Promise<import("expo-modules-core").PermissionResponse>, () => Promise<import("expo-modules-core").PermissionResponse>];
/**
 * Android system sometimes kills the `MainActivity` after the `ImagePicker` finishes. When this
 * happens, we lost the data selected from the `ImagePicker`. However, you can retrieve the lost
 * data by calling `getPendingResultAsync`. You can test this functionality by turning on
 * `Don't keep activities` in the developer options.
 * @return
 * - **On Android:** a promise that resolves to an array of objects of exactly same type as in
 * `ImagePicker.launchImageLibraryAsync` or `ImagePicker.launchCameraAsync` if the `ImagePicker`
 * finished successfully. Otherwise, to the array of [`ImagePickerErrorResult`](#imagepickerimagepickererrorresult).
 * - **On other platforms:** an empty array.
 */
export declare function getPendingResultAsync(): Promise<(ImagePickerResult | ImagePickerErrorResult)[]>;
/**
 * Display the system UI for taking a photo with the camera. Requires `Permissions.CAMERA`.
 * On Android and iOS 10 `Permissions.CAMERA_ROLL` is also required. On mobile web, this must be
 * called immediately in a user interaction like a button press, otherwise the browser will bloc
 * the request without a warning.
 * > **Note:** Make sure that you handle `MainActivity` destruction on **Android**. See [ImagePicker.getPendingResultAsync](#imagepickergetpendingresultasync).
 * > **Notes for Web:** The system UI can only be shown after user activation (e.g. a `Button` press).
 * Therefore, calling `launchCameraAsync` in `componentDidMount`, for example, will **not** work as
 * intended. The `cancelled` event will not be returned in the browser due to platform restrictions
 * and inconsistencies across browsers.
 * @param options An `ImagePickerOptions` object.
 * @return If the user cancelled the action, the method returns `{ cancelled: true }`. Otherwise,
 * this method returns information about the selected media item. When the chosen item is an image,
 * this method returns `{ cancelled: false, type: 'image', uri, width, height, exif, base64 }`;
 * when the item is a video, this method returns `{ cancelled: false, type: 'video', uri, width, height, duration }`.
 */
export declare function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
/**
 * Display the system UI for choosing an image or a video from the phone's library.
 * Requires `Permissions.MEDIA_LIBRARY` on iOS 10 only. On mobile web, this must be called
 * immediately in a user interaction like a button press, otherwise the browser will block the
 * request without a warning.
 * **Animated GIFs support** If the selected image is an animated GIF, the result image will be an
 * animated GIF too if and only if `quality` is set to `undefined` and `allowsEditing` is set to `false`.
 * Otherwise compression and/or cropper will pick the first frame of the GIF and return it as the
 * result (on Android the result will be a PNG, on iOS — GIF).
 * > **Notes for Web:** The system UI can only be shown after user activation (e.g. a `Button` press).
 * Therefore, calling `launchImageLibraryAsync` in `componentDidMount`, for example, will **not**
 * work as intended. The `cancelled` event will not be returned in the browser due to platform
 * restrictions and inconsistencies across browsers.
 * @param options An object extended by [`ImagePickerOptions`](#imagepickeroptions).
 * @return If the user cancelled the action, the method returns `{ cancelled: true }`. Otherwise,
 * this method returns information about the selected media item. When the chosen item is an image,
 * this method returns `{ cancelled: false, type: 'image', uri, width, height, exif, base64 }`;
 * when the item is a video, this method returns `{ cancelled: false, type: 'video', uri, width, height, duration }`.
 */
export declare function launchImageLibraryAsync<T extends ImagePickerOptions>(options?: T): Promise<ExpandImagePickerResult<T>>;
export { MediaTypeOptions, ImagePickerOptions, ImagePickerResult, ImagePickerErrorResult, VideoExportPreset, CameraPermissionResponse, CameraRollPermissionResponse, MediaLibraryPermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions, ImageInfo, ImagePickerMultipleResult, ImagePickerCancelledResult, OpenFileBrowserOptions, ExpandImagePickerResult, UIImagePickerControllerQualityType, UIImagePickerPresentationStyle, };
