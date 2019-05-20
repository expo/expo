import { UnavailabilityError } from '@unimodules/core';
import ExponentImagePicker from './ExponentImagePicker';
import { MediaTypeOptions } from './ImagePicker.types';
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
export { MediaTypeOptions };
//# sourceMappingURL=ImagePicker.js.map