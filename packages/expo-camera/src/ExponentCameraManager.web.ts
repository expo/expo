import LibCameraPhoto, { FACING_MODES } from 'jslib-html5-camera-photo';
import invariant from 'invariant';
import { PictureOptions, CapturedPicture } from './Camera.types';

export default {
  get name(): string {
    return 'ExponentCameraManager';
  },
  get Type() {
    return {
      back: 'back',
      front: 'front',
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
      width: 0, //undefined,
      height: 0, //undefined,
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
  async pausePreview(camera: LibCameraPhoto): Promise<any> {
    return await camera.stopCamera();
  },
  async resumePreview(camera: LibCameraPhoto): Promise<any> {
    if (!camera.__cameraFacingMode) {
      camera.__cameraFacingMode = this.Type.front; // FACING_MODES.USER;
    }
    const facingMode = CameraTypeMap[camera.__cameraFacingMode];
    return await camera.startCamera(facingMode, {});
  },
  async setFacingMode(camera: LibCameraPhoto, facingMode: string): Promise<any> {
    invariant(
      facingMode in this.Type,
      `CameraManager.setFacingMode(): Invalid facing mode: ${facingMode}`
    );
    camera.__cameraFacingMode = facingMode;
    return await this.resumePreview(camera);
  },
};

const CameraTypeMap = {
  front: FACING_MODES.USER,
  back: FACING_MODES.ENVIRONMENT,
};
