import { UnavailabilityError, CodedError } from '@unimodules/core';
import { PermissionStatus } from 'unimodules-permissions-interface';
import ExponentImagePicker from './ExponentImagePicker';
import { MediaTypeOptions, VideoExportPreset, } from './ImagePicker.types';
function validateOptions(options) {
    const { aspect, quality, videoMaxDuration } = options;
    if (aspect != null) {
        const [x, y] = aspect;
        if (x <= 0 || y <= 0) {
            throw new CodedError('ERR_INVALID_ARGUMENT', 'Invalid aspect ratio values');
        }
    }
    if (quality && (quality < 0 || quality > 1)) {
        throw new CodedError('ERR_INVALID_ARGUMENT', 'Quality value must be between 0 and 1');
    }
    if (videoMaxDuration && videoMaxDuration < 0) {
        throw new CodedError('ERR_INVALID_ARGUMENT', 'videoMaxDuration must be a non-negative number');
    }
}
export async function getCameraPermissionsAsync() {
    return ExponentImagePicker.getCameraPermissionsAsync();
}
export async function getCameraRollPermissionsAsync() {
    return ExponentImagePicker.getCameraRollPermissionsAsync();
}
export async function requestCameraPermissionsAsync() {
    return ExponentImagePicker.requestCameraPermissionsAsync();
}
export async function requestCameraRollPermissionsAsync() {
    return ExponentImagePicker.requestCameraRollPermissionsAsync();
}
export async function launchImageLibraryAsync(options = {}) {
    if (!ExponentImagePicker.launchImageLibraryAsync) {
        throw new UnavailabilityError('ImagePicker', 'launchImageLibraryAsync');
    }
    validateOptions(options);
    return await ExponentImagePicker.launchImageLibraryAsync(options);
}
export async function launchCameraAsync(options = {}) {
    if (!ExponentImagePicker.launchCameraAsync) {
        throw new UnavailabilityError('ImagePicker', 'launchCameraAsync');
    }
    validateOptions(options);
    return await ExponentImagePicker.launchCameraAsync(options);
}
export { MediaTypeOptions, VideoExportPreset, PermissionStatus, };
//# sourceMappingURL=ImagePicker.js.map