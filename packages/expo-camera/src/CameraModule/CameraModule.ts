import invariant from 'invariant';

import { PictureOptions } from '../Camera.types';
import { CameraType, CapturedPicture, CaptureOptions, ImageType } from './CameraModule.types';
import * as Utils from './CameraUtils';
import { FacingModeToCameraType, PictureSizes } from './constants';
import * as CapabilityUtils from './CapabilityUtils';

export { ImageType, CameraType, CaptureOptions };

/*
 * TODO: Bacon: Add more props for Android
 *
 * aspectRatio: { min (0.00033), max (4032) }
 * colorTemperature: MediaSettingsRange  (max: 7000, min: 2850, step: 50)
 * exposureCompensation: MediaSettingsRange (max: 2, min: -2, step: 0.1666666716337204)
 * exposureMode: 'continuous' | 'manual'
 * frameRate: { min: (1), max: (60) }
 * iso: MediaSettingsRange (max: 3200, min: 50, step: 1)
 * width: { min: 1, max}
 * height: { min: 1, max}
 */

type OnCameraReadyListener = () => void;
type OnMountErrorListener = ({ nativeEvent: Error }) => void;

class CameraModule {
  videoElement: HTMLVideoElement;
  stream: MediaStream | null = null;
  settings: MediaTrackSettings | null = null;
  onCameraReady: OnCameraReadyListener = () => {};
  onMountError: OnMountErrorListener = () => {};
  _pictureSize?: string;
  _isStartingCamera = false;

  _autoFocus: string = 'continuous';
  get autoFocus(): string {
    return this._autoFocus;
  }
  async setAutoFocusAsync(value: string): Promise<void> {
    if (value === this.autoFocus) {
      return;
    }
    this._autoFocus = value;
    await this._syncTrackCapabilities();
  }

  _flashMode: string = 'off';
  get flashMode(): string {
    return this._flashMode;
  }
  async setFlashModeAsync(value: string): Promise<void> {
    if (value === this.flashMode) {
      return;
    }
    this._flashMode = value;
    await this._syncTrackCapabilities();
  }

  _whiteBalance: string = 'continuous';

  get whiteBalance(): string {
    return this._whiteBalance;
  }

  async setWhiteBalanceAsync(value: string): Promise<void> {
    if (value === this.whiteBalance) {
      return;
    }
    this._whiteBalance = value;
    await this._syncTrackCapabilities();
  }

  _cameraType: CameraType = CameraType.front;

  get type(): CameraType {
    return this._cameraType;
  }

  async setTypeAsync(value: CameraType) {
    if (value === this._cameraType) {
      return;
    }
    this._cameraType = value;
    await this.resumePreview();
  }

  _zoom: number = 1;

  get zoom(): number {
    return this._zoom;
  }

  async setZoomAsync(value: number): Promise<void> {
    if (value === this.zoom) {
      return;
    }
    //TODO: Bacon: IMP on non-android devices
    this._zoom = value;
    await this._syncTrackCapabilities();
  }

  setPictureSize(value: string) {
    if (value === this._pictureSize) {
      return;
    }
    invariant(
      PictureSizes.includes(value),
      `expo-camera: CameraModule.setPictureSize(): invalid size supplied ${value}, expected one of: ${PictureSizes.join(
        ', '
      )}`
    );

    const [width, height] = value.split('x');
    //TODO: Bacon: IMP
    const aspectRatio = parseFloat(width) / parseFloat(height);

    this._pictureSize = value;
  }

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    if (this.videoElement) {
      this.videoElement.addEventListener('loadedmetadata', () => {
        this._syncTrackCapabilities();
      });
    }
  }

  async onCapabilitiesReady(track: MediaStreamTrack): Promise<void> {
    const capabilities = track.getCapabilities() as any;

    // Create an empty object because if you set a constraint that isn't available an error will be thrown.
    const constraints: {
      zoom?: number;
      torch?: boolean;
      whiteBalance?: string;
      focusMode?: string;
    } = {};

    if (capabilities.zoom) {
      // TODO: Bacon: We should have some async method for getting the (min, max, step) externally
      const { min, max } = capabilities.zoom;
      constraints.zoom = Math.min(max, Math.max(min, this._zoom));
    }
    if (capabilities.focusMode) {
      constraints.focusMode = CapabilityUtils.convertAutoFocusJSONToNative(this.autoFocus);
    }
    if (capabilities.torch) {
      constraints.torch = CapabilityUtils.convertFlashModeJSONToNative(this.flashMode);
    }
    if (capabilities.whiteBalance) {
      constraints.whiteBalance = this.whiteBalance;
    }

    await track.applyConstraints({ advanced: [constraints] as any });
  }

  async _syncTrackCapabilities(): Promise<void> {
    if (this.stream) {
      await Promise.all(this.stream.getTracks().map(track => this.onCapabilitiesReady(track)));
    }
  }

  setVideoSource(stream: MediaStream | MediaSource | Blob | null): void {
    if ('srcObject' in this.videoElement) {
      this.videoElement.srcObject = stream;
    } else {
      // TODO: Bacon: Check if needed
      (this.videoElement['src'] as any) = window.URL.createObjectURL(stream);
    }
  }

  setSettings(stream: MediaStream | null): void {
    this.settings = null;
    if (stream && this.stream) {
      this.settings = this.stream.getTracks()[0].getSettings();
    }
  }

  setStream(stream: MediaStream | null): void {
    this.stream = stream;
    this.setSettings(stream);
    this.setVideoSource(stream);
  }

  getActualCameraType(): CameraType | null {
    if (this.settings) {
      // On desktop no value will be returned, in this case we should assume the cameraType is 'front'
      const { facingMode = 'user' } = this.settings;
      return FacingModeToCameraType[facingMode];
    }
    return null;
  }

  async ensureCameraIsRunningAsync(): Promise<void> {
    if (!this.stream) {
      await this.resumePreview();
    }
  }

  async resumePreview(): Promise<MediaStream | null> {
    if (this._isStartingCamera) {
      return null;
    }
    this._isStartingCamera = true;
    try {
      this.pausePreview();
      const stream = await Utils.getStreamDevice(this.type);
      this.setStream(stream);
      this._isStartingCamera = false;
      this.onCameraReady();
      return stream;
    } catch (error) {
      this._isStartingCamera = false;
      this.onMountError({ nativeEvent: error });
    }
    return null;
  }

  takePicture(config: PictureOptions): CapturedPicture {
    const base64 = Utils.captureImage(this.videoElement, config);

    const capturedPicture: CapturedPicture = {
      uri: base64,
      base64,
      width: 0,
      height: 0,
    };

    if (this.settings) {
      const { width = 0, height = 0 } = this.settings;
      capturedPicture.width = width;
      capturedPicture.height = height;
      // TODO: Bacon: verify/enforce exif shape.
      capturedPicture.exif = this.settings;
    }

    if (config.onPictureSaved) {
      config.onPictureSaved({ nativeEvent: { data: capturedPicture, id: config.id } });
    }
    return capturedPicture;
  }

  pausePreview(): void {
    if (!this.stream) {
      return;
    }
    this.stream.getTracks().forEach(track => track.stop());
    this.setStream(null);
  }

  // TODO: Bacon: we don't even use ratio in native...
  getAvailablePictureSizes = async (ratio: string): Promise<string[]> => {
    return PictureSizes;
  };

  unmount = () => {
    this.settings = null;
    this.stream = null;
  };
}

export default CameraModule;
