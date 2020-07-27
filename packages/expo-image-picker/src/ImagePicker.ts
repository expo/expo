import { UnavailabilityError } from '@unimodules/core';
import { PermissionStatus, PermissionExpiration } from 'unimodules-permissions-interface';

import ExponentImagePicker from './ExponentImagePicker';
import {
  CameraPermissionResponse,
  CameraRollPermissionResponse,
  ImagePickerResult,
  MediaTypeOptions,
  ImagePickerOptions,
  VideoExportPreset,
} from './ImagePicker.types';

export async function getCameraPermissionsAsync(): Promise<CameraPermissionResponse> {
  return ExponentImagePicker.getCameraPermissionsAsync();
}

export async function getCameraRollPermissionsAsync(): Promise<CameraRollPermissionResponse> {
  return ExponentImagePicker.getCameraRollPermissionsAsync();
}

export async function requestCameraPermissionsAsync(): Promise<CameraPermissionResponse> {
  return ExponentImagePicker.requestCameraPermissionsAsync();
}

export async function requestCameraRollPermissionsAsync(): Promise<CameraRollPermissionResponse> {
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

export {
  MediaTypeOptions,
  ImagePickerOptions,
  ImagePickerResult,
  VideoExportPreset,
  CameraPermissionResponse,
  CameraRollPermissionResponse,
  PermissionStatus,
  PermissionExpiration,
};
