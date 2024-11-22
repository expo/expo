import { CameraType, ImageType } from '../Camera.types';

// https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/aspectRatio
export const VIDEO_ASPECT_RATIOS = {
  '3840x2160': 3840 / 2160,
  '1920x1080': 1920 / 1080,
  '1280x720': 1280 / 720,
  '640x480': 640 / 480,
  '352x288': 352 / 288,
};

export const PictureSizes = Object.keys(VIDEO_ASPECT_RATIOS);

export const ImageTypeFormat: Record<ImageType, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
};

export const MinimumConstraints: MediaStreamConstraints = {
  audio: false,
  video: true,
};

export const CameraTypeToFacingMode: Record<CameraType, string> = {
  front: 'user',
  back: 'environment',
};

export const FacingModeToCameraType: Record<string, CameraType> = {
  user: 'front',
  environment: 'back',
};
