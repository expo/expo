import { CameraType, ImageType } from '../legacy/Camera.types';
// https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/aspectRatio
export const VIDEO_ASPECT_RATIOS = {
    '3840x2160': 3840 / 2160,
    '1920x1080': 1920 / 1080,
    '1280x720': 1280 / 720,
    '640x480': 640 / 480,
    '352x288': 352 / 288,
};
export const PictureSizes = Object.keys(VIDEO_ASPECT_RATIOS);
export const ImageTypeFormat = {
    [ImageType.jpg]: 'image/jpeg',
    [ImageType.png]: 'image/png',
};
export const MinimumConstraints = {
    audio: false,
    video: true,
};
export const CameraTypeToFacingMode = {
    [CameraType.front]: 'user',
    [CameraType.back]: 'environment',
};
export const FacingModeToCameraType = {
    user: CameraType.front,
    environment: CameraType.back,
};
//# sourceMappingURL=WebConstants.js.map