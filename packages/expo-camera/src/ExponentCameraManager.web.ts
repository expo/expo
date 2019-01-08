import { CapturedPicture, PictureOptions } from './Camera.types';
import ExponentCamera from './ExponentCamera.web';

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
      torch: 'torch',
    };
  },
  get AutoFocus() {
    return {
      on: 'on',
      off: 'off',
      auto: 'auto',
      singleShot: 'singleShot',
    };
  },
  get WhiteBalance() {
    return {
      auto: 'auto',
      continuous: 'continuous',
      manual: 'manual',
    };
  },
  get VideoQuality() {
    return {};
  },

  // TODO: Bacon: Is video possible?
  // record(options): Promise
  // stopRecording(): Promise<void>
  async takePicture(options: PictureOptions, camera: ExponentCamera): Promise<CapturedPicture> {
    return await camera.takePicture(options);
  },
  async pausePreview(camera: ExponentCamera): Promise<void> {
    camera.pausePreview();
  },
  async resumePreview(camera: ExponentCamera): Promise<any> {
    return await camera.resumePreview();
  },
  async getAvailablePictureSizes(ratio: string, camera: ExponentCamera): Promise<string[]> {
    return await camera.getAvailablePictureSizes(ratio);
  },
};
