// @flow

import { NativeModules } from 'react-native';

const { ExponentImagePicker } = NativeModules;

const MEDIA_TYPE_OPTIONS = {
  All: 'All',
  Videos: 'Videos',
  Images: 'Images',
};

type ImageInfo = {|
  uri: string,
  width: number,
  height: number,
|};

type ImageResult = {| cancelled: true |} | ({| cancelled: false |} & ImageInfo);

type ImageLibraryOptions = {
  allowsEditing?: boolean,
  aspect?: [number, number],
  quality?: number,
  mediaTypes?: $Keys<typeof MEDIA_TYPE_OPTIONS>,
};

export async function launchImageLibraryAsync(
  options?: ImageLibraryOptions = {}
): Promise<ImageResult> {
  return ExponentImagePicker.launchImageLibraryAsync(options);
}

type CameraOptions = {
  allowsEditing?: boolean,
  aspect?: [number, number],
  quality?: number,
};

export async function launchCameraAsync(options?: CameraOptions = {}): Promise<ImageResult> {
  return ExponentImagePicker.launchCameraAsync(options);
}

export const MediaTypeOptions: Object = MEDIA_TYPE_OPTIONS;
