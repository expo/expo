import { UnavailabilityError } from '@unimodules/core';

import ExponentImagePicker from './ExponentImagePicker';
import { ImagePickerResult, MediaTypeOptions, ImagePickerOptions } from './ImagePicker.types';

export async function launchImageLibraryAsync(
  options: ImagePickerOptions = {}
): Promise<ImagePickerResult> {
  if (!ExponentImagePicker.launchImageLibraryAsync) {
    throw new UnavailabilityError('ImagePicker', 'launchImageLibraryAsync');
  }
  return await ExponentImagePicker.launchImageLibraryAsync(options);
}

export async function launchCameraAsync(
  options: ImagePickerOptions = {}
): Promise<ImagePickerResult> {
  if (!ExponentImagePicker.launchCameraAsync) {
    throw new UnavailabilityError('ImagePicker', 'launchCameraAsync');
  }
  return await ExponentImagePicker.launchCameraAsync(options);
}

export { MediaTypeOptions, ImagePickerOptions, ImagePickerResult };
