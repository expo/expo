import { UnavailabilityError } from '@unimodules/core';

import ExponentImagePicker from './ExponentImagePicker';
import {
  ImagePickerResult,
  MediaTypeOptions,
  ImagePickerOptions,
  PermissionsResponse,
} from './ImagePicker.types';

export async function getCameraPermissionsAsync(): Promise<PermissionsResponse> {
  return ExponentImagePicker.getCameraPermissionsAsync();
}

export async function getCameraRollPermissionsAsync(): Promise<PermissionsResponse> {
  return ExponentImagePicker.getCameraRollPermissionsAsync();
}

export async function requestCameraPermissionsAsync(): Promise<PermissionsResponse> {
  return ExponentImagePicker.requestCameraPermissionsAsync();
}

export async function requestCameraRollPermissionsAsync(): Promise<PermissionsResponse> {
  return ExponentImagePicker.requestCameraRollPermissionsAsync();
}

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
