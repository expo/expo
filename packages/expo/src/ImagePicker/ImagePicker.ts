import { UnavailabilityError } from 'expo-errors';

import ExponentImagePicker from './ExponentImagePicker';
import { ImageResult, MediaTypeOptions, PickerOptions } from './ImagePicker.types';

export async function launchImageLibraryAsync(options: PickerOptions = {}): Promise<ImageResult> {
  if (!ExponentImagePicker.launchImageLibraryAsync) {
    throw new UnavailabilityError('ImagePicker', 'launchImageLibraryAsync');
  }
  return await ExponentImagePicker.launchImageLibraryAsync(options);
}

export async function launchCameraAsync(options: PickerOptions = {}): Promise<ImageResult> {
  if (!ExponentImagePicker.launchCameraAsync) {
    throw new UnavailabilityError('ImagePicker', 'launchCameraAsync');
  }
  return await ExponentImagePicker.launchCameraAsync(options);
}

export { MediaTypeOptions, PickerOptions, ImageResult };
