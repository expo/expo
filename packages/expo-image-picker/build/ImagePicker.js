import { UnavailabilityError } from '@unimodules/core';
import { PermissionStatus, } from 'unimodules-permissions-interface';
import ExponentImagePicker from './ExponentImagePicker';
import { MediaTypeOptions, VideoExportPreset, } from './ImagePicker.types';
import { WEB_launchImageLibraryAsync } from './ExponentImagePicker.web';
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
    return await ExponentImagePicker.launchImageLibraryAsync(options);
}
export async function launchCameraAsync(options = {}) {
    if (!ExponentImagePicker.launchCameraAsync) {
        throw new UnavailabilityError('ImagePicker', 'launchCameraAsync');
    }
    return await ExponentImagePicker.launchCameraAsync(options);
}
export async function launchImageLibraryAsync(options = {}) {
    return WEB_launchImageLibraryAsync(options);
}
export { MediaTypeOptions, VideoExportPreset, PermissionStatus, };
//# sourceMappingURL=ImagePicker.js.map