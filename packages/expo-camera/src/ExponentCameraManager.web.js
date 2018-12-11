// @flow
import LibCameraPhoto, { FACING_MODES } from 'jslib-html5-camera-photo';

import type { PictureOptions, CapturedPicture } from './Camera.types';

export default {
  get name(): string {
    return 'ExponentCameraManager';
  },
  get Type() {
    return {
      back: FACING_MODES.ENVIRONMENT,
      front: FACING_MODES.USER,
    };
  },
  get FlashMode() {
    return {
      on: 'on',
      off: 'off',
      auto: 'auto',
    };
  },
  get AutoFocus() {
    return {
      on: 'on',
      off: 'off',
      auto: 'auto',
    };
  },
  get WhiteBalance() {
    return {
      auto: 'auto',
    };
  },
  get VideoQuality() {
    return {};
  },
  async takePicture(options: PictureOptions, camera: LibCameraPhoto): Promise<CapturedPicture> {
    const config = {
      ...options,
      imageCompression: options.quality || 0.92,
      // sizeFactor: 1,
      // imageType: 'jpg',
      // isImageMirror:
    };

    const dataUri = camera.getDataUri(config);

    const capturedPicture = {
      uri: dataUri,
      base64: dataUri,
      width: undefined,
      height: undefined,
      exif: undefined,
    };

    const cameraSettigs = camera.getCameraSettings();
    if (cameraSettigs) {
      const { height, width } = cameraSettigs;
      capturedPicture.width = width;
      capturedPicture.height = height;
      capturedPicture.exif = cameraSettigs;
    }

    if (options.onPictureSaved) {
      options.onPictureSaved(capturedPicture);
    }

    return capturedPicture;
  },
  async pausePreview(camera: LibCameraPhoto): Promise {
    return await camera.stopCamera();
  },
  async resumePreview(camera: LibCameraPhoto): Promise {
    if (!camera.__cameraFacingMode) {
      camera.__cameraFacingMode = FACING_MODES.USER;
    }
    return await camera.startCameraMaxResolution(camera.__cameraFacingMode);
  },
};
