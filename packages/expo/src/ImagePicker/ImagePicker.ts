import { UnavailabilityError } from 'expo-errors';

import ExponentImagePicker from './ExponentImagePicker';
import { CameraOptions, ImageLibraryOptions, ImageResult } from './ImagePicker.types';

export { default as MediaTypeOptions } from './MediaTypeOptions';

export async function launchImageLibraryAsync(
  options: ImageLibraryOptions = {}
): Promise<ImageResult> {
  if (!ExponentImagePicker.launchImageLibraryAsync) {
    throw new UnavailabilityError('ImagePicker', 'launchImageLibraryAsync');
  }
  return ExponentImagePicker.launchImageLibraryAsync(options);
}

export async function launchCameraAsync(options: CameraOptions = {}): Promise<ImageResult> {
  if (!ExponentImagePicker.launchCameraAsync) {
    throw new UnavailabilityError('ImagePicker', 'launchCameraAsync');
  }
  return ExponentImagePicker.launchCameraAsync(options);
}
