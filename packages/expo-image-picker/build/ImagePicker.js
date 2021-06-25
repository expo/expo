import { UnavailabilityError, CodedError } from '@unimodules/core';
import { PermissionStatus } from 'expo-modules-core';
import ExponentImagePicker from './ExponentImagePicker';
import { MediaTypeOptions, VideoExportPreset, } from './ImagePicker.types';
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
export async function getCameraPermissionsAsync() {
    return ExponentImagePicker.getCameraPermissionsAsync();
}
/**
 * @deprecated in favor of getMediaLibraryPermissionsAsync()
 */
export async function getCameraRollPermissionsAsync() {
    console.warn('ImagePicker.getCameraRollPermissionsAsync() is deprecated in favour of ImagePicker.getMediaLibraryPermissionsAsync()');
    return getMediaLibraryPermissionsAsync();
}
export async function getMediaLibraryPermissionsAsync(writeOnly = false) {
    // due to a typo in iOS, we need to check on the typo too
    // todo: remove this workaround for SDK 41
    const imagePickerMethod = typeof ExponentImagePicker.getMediaLibaryPermissionsAsync === 'function'
        ? ExponentImagePicker.getMediaLibaryPermissionsAsync
        : ExponentImagePicker.getMediaLibraryPermissionsAsync;
    return imagePickerMethod(writeOnly);
}
export async function requestCameraPermissionsAsync() {
    return ExponentImagePicker.requestCameraPermissionsAsync();
}
/**
 * @deprecated in favor of requestMediaLibraryPermissionsAsync()
 */
export async function requestCameraRollPermissionsAsync() {
    console.warn('ImagePicker.requestCameraRollPermissionsAsync() is deprecated in favour of ImagePicker.requestMediaLibraryPermissionsAsync()');
    return requestMediaLibraryPermissionsAsync();
}
export async function requestMediaLibraryPermissionsAsync(writeOnly = false) {
    // due to a typo in iOS, we need to check on the typo too
    // todo: remove this workaround for SDK 41
    const imagePickerMethod = typeof ExponentImagePicker.requestMediaLibaryPermissionsAsync === 'function'
        ? ExponentImagePicker.requestMediaLibaryPermissionsAsync
        : ExponentImagePicker.requestMediaLibraryPermissionsAsync;
    return imagePickerMethod(writeOnly);
}
export async function getPendingResultAsync() {
    if (ExponentImagePicker.getPendingResultAsync) {
        return ExponentImagePicker.getPendingResultAsync();
    }
    return [];
}
export async function launchCameraAsync(options = {}) {
    if (!ExponentImagePicker.launchCameraAsync) {
        throw new UnavailabilityError('ImagePicker', 'launchCameraAsync');
    }
    return await ExponentImagePicker.launchCameraAsync(validateOptions(options));
}
export async function launchImageLibraryAsync(options) {
    if (!ExponentImagePicker.launchImageLibraryAsync) {
        throw new UnavailabilityError('ImagePicker', 'launchImageLibraryAsync');
    }
    return await ExponentImagePicker.launchImageLibraryAsync(options ?? {});
}
export { MediaTypeOptions, VideoExportPreset, PermissionStatus, };
//# sourceMappingURL=ImagePicker.js.map