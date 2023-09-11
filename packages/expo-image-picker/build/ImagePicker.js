import { PermissionStatus, createPermissionHook, UnavailabilityError, CodedError, } from 'expo-modules-core';
import ExponentImagePicker from './ExponentImagePicker';
function validateOptions(options) {
    const { aspect, quality, videoMaxDuration } = options;
    if (aspect != null) {
        const [x, y] = aspect;
        if (x <= 0 || y <= 0) {
            throw new CodedError('ERR_INVALID_ARGUMENT', `Invalid aspect ratio values ${x}:${y}. Provide positive numbers.`);
        }
    }
    if (quality && (quality < 0 || quality > 1)) {
        throw new CodedError('ERR_INVALID_ARGUMENT', `Invalid 'quality' value ${quality}. Provide a value between 0 and 1.`);
    }
    if (videoMaxDuration && videoMaxDuration < 0) {
        throw new CodedError('ERR_INVALID_ARGUMENT', `Invalid 'videoMaxDuration' value ${videoMaxDuration}. Provide a non-negative number.`);
    }
    return options;
}
// @needsAudit
/**
 * Checks user's permissions for accessing camera.
 * @return A promise that fulfills with an object of type [CameraPermissionResponse](#camerapermissionresponse).
 */
export async function getCameraPermissionsAsync() {
    return ExponentImagePicker.getCameraPermissionsAsync();
}
// @needsAudit
/**
 * Checks user's permissions for accessing photos.
 * @param writeOnly Whether to request write or read and write permissions. Defaults to `false`
 * @return A promise that fulfills with an object of type [MediaLibraryPermissionResponse](#medialibrarypermissionresponse).
 */
export async function getMediaLibraryPermissionsAsync(writeOnly = false) {
    return ExponentImagePicker.getMediaLibraryPermissionsAsync(writeOnly);
}
// @needsAudit
/**
 * Asks the user to grant permissions for accessing camera. This does nothing on web because the
 * browser camera is not used.
 * @return A promise that fulfills with an object of type [CameraPermissionResponse](#camerarollpermissionresponse).
 */
export async function requestCameraPermissionsAsync() {
    return ExponentImagePicker.requestCameraPermissionsAsync();
}
// @needsAudit
/**
 * Asks the user to grant permissions for accessing user's photo. This method does nothing on web.
 * @param writeOnly Whether to request write or read and write permissions. Defaults to `false`
 * @return A promise that fulfills with an object of type [MediaLibraryPermissionResponse](#medialibrarypermissionresponse).
 */
export async function requestMediaLibraryPermissionsAsync(writeOnly = false) {
    const imagePickerMethod = ExponentImagePicker.requestMediaLibraryPermissionsAsync;
    return imagePickerMethod(writeOnly);
}
// @needsAudit
/**
 * Check or request permissions to access the media library.
 * This uses both `requestMediaLibraryPermissionsAsync` and `getMediaLibraryPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = ImagePicker.useMediaLibraryPermissions();
 * ```
 */
export const useMediaLibraryPermissions = createPermissionHook({
    // TODO(cedric): permission requesters should have an options param or a different requester
    getMethod: (options) => getMediaLibraryPermissionsAsync(options?.writeOnly),
    requestMethod: (options) => requestMediaLibraryPermissionsAsync(options?.writeOnly),
});
// @needsAudit
/**
 * Check or request permissions to access the camera.
 * This uses both `requestCameraPermissionsAsync` and `getCameraPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = ImagePicker.useCameraPermissions();
 * ```
 */
export const useCameraPermissions = createPermissionHook({
    getMethod: getCameraPermissionsAsync,
    requestMethod: requestCameraPermissionsAsync,
});
// @needsAudit
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
export async function getPendingResultAsync() {
    if (ExponentImagePicker.getPendingResultAsync) {
        return ExponentImagePicker.getPendingResultAsync();
    }
    return [];
}
// @needsAudit
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
export async function launchCameraAsync(options = {}) {
    if (!ExponentImagePicker.launchCameraAsync) {
        throw new UnavailabilityError('ImagePicker', 'launchCameraAsync');
    }
    return await ExponentImagePicker.launchCameraAsync(validateOptions(options));
}
// @needsAudit
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
export async function launchImageLibraryAsync(options) {
    if (!ExponentImagePicker.launchImageLibraryAsync) {
        throw new UnavailabilityError('ImagePicker', 'launchImageLibraryAsync');
    }
    if (options?.allowsEditing && options.allowsMultipleSelection) {
        console.warn('[expo-image-picker] `allowsEditing` is not supported when `allowsMultipleSelection` is enabled and will be ignored.' +
            "Disable either 'allowsEditing' or 'allowsMultipleSelection' in 'launchImageLibraryAsync' " +
            'to fix this warning.');
    }
    return await ExponentImagePicker.launchImageLibraryAsync(options ?? {});
}
export * from './ImagePicker.types';
export { PermissionStatus };
//# sourceMappingURL=ImagePicker.js.map