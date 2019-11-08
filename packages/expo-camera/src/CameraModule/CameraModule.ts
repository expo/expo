/* eslint-env browser */

import invariant from 'invariant';

import { PictureOptions } from '../Camera.types';
import { CameraType, CapturedPicture, CaptureOptions, ImageType } from './CameraModule.types';
import * as Utils from './CameraUtils';
import * as CapabilityUtils from './CapabilityUtils';
import { FacingModeToCameraType, PictureSizes } from './constants';
import { isBackCameraAvailableAsync, isFrontCameraAvailableAsync } from './UserMediaManager';

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
    await this.syncTrackCapabilities();
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
    await this.syncTrackCapabilities();
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
    await this.syncTrackCapabilities();
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
    await this.syncTrackCapabilities();
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
    // eslint-disable-next-line
    const aspectRatio = parseFloat(width) / parseFloat(height);

    this._pictureSize = value;
  }

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    if (this.videoElement) {
      this.videoElement.addEventListener('loadedmetadata', () => {
        this.syncTrackCapabilities();
      });
    }
  }

  public isTorchAvailable(): boolean {
    return isCapabilityAvailable(this.videoElement, 'torch');
  }

  public isZoomAvailable(): boolean {
    return isCapabilityAvailable(this.videoElement, 'zoom');
  }

  private async onCapabilitiesReady(track: MediaStreamTrack): Promise<void> {
    const capabilities: any = track.getCapabilities();

    // Create an empty object because if you set a constraint that isn't available an error will be thrown.
    const constraints: {
      zoom?: number;
      torch?: boolean;
      whiteBalance?: string;
      focusMode?: string;
      height?: number;
      width?: number;
      aspectRatio?: number;
    } = {};

    if (capabilities.zoom) {
      const { min, max } = capabilities.zoom;
      const converted = convertRange(this._zoom, [min, max]);
      constraints.zoom = Math.min(max, Math.max(min, converted));
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

    // Create max-res camera
    // if (capabilities.aspectRatio && capabilities.aspectRatio.max) {
    //   constraints.aspectRatio = capabilities.aspectRatio.max;
    // }

    await track.applyConstraints({ advanced: [constraints] as any });
  }

  private async applyVideoConstraints(constraints: { [key: string]: any }): Promise<boolean> {
    if (!this.stream || !this.stream.getVideoTracks) {
      return false;
    }
    return await applyConstraints(this.stream.getVideoTracks(), constraints);
  }

  private async applyAudioConstraints(constraints: { [key: string]: any }): Promise<boolean> {
    if (!this.stream || !this.stream.getAudioTracks) {
      return false;
    }
    return await applyConstraints(this.stream.getAudioTracks(), constraints);
  }

  private async syncTrackCapabilities(): Promise<void> {
    if (this.stream && this.stream.getVideoTracks) {
      await Promise.all(this.stream.getVideoTracks().map(track => this.onCapabilitiesReady(track)));
    }
  }

  setStream(stream: MediaStream | null): void {
    this.stream = stream;
    this.settings = stream ? stream.getTracks()[0].getSettings() : null;
    setVideoSource(this.videoElement, stream);
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
      this.stopAsync();
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

  stopAsync(): void {
    stopMediaStream(this.stream);
    this.setStream(null);
  }

  // TODO: Bacon: we don't even use ratio in native...
  getAvailablePictureSizes = async (ratio: string): Promise<string[]> => {
    return PictureSizes;
  };

  getAvailableCameraTypesAsync = async (): Promise<string[]> => {
    if (!navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();

    const types: (string | null)[] = await Promise.all([
      (await isFrontCameraAvailableAsync(devices)) && CameraType.front,
      (await isBackCameraAvailableAsync()) && CameraType.back,
    ]);

    return types.filter(Boolean) as string[];
  };
}

function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return;
  if (stream.getAudioTracks) stream.getAudioTracks().forEach(track => track.stop());
  if (stream.getVideoTracks) stream.getVideoTracks().forEach(track => track.stop());
  if (isMediaStreamTrack(stream)) stream.stop();
}

function setVideoSource(
  video: HTMLVideoElement,
  stream: MediaStream | MediaSource | Blob | null
): void {
  try {
    video.srcObject = stream;
  } catch (_) {
    if (stream) {
      video.src = window.URL.createObjectURL(stream);
    } else if (typeof video.src === 'string') {
      window.URL.revokeObjectURL(video.src);
    }
  }
}

async function applyConstraints(
  tracks: MediaStreamTrack[],
  constraints: { [key: string]: any }
): Promise<boolean> {
  try {
    await Promise.all(
      tracks.map(async track => {
        await track.applyConstraints({ advanced: [constraints] as any });
      })
    );
    return true;
  } catch (_) {
    return false;
  }
}

function isCapabilityAvailable(video: HTMLVideoElement, keyName: string): boolean {
  const stream = video.srcObject;

  if (stream instanceof MediaStream) {
    const videoTrack = stream.getVideoTracks()[0];

    if (typeof videoTrack.getCapabilities === 'undefined') {
      return false;
    }

    const capabilities: any = videoTrack.getCapabilities();

    return !!capabilities[keyName];
  }

  return false;
}

function isMediaStreamTrack(input: any): input is MediaStreamTrack {
  return typeof input.stop === 'function';
}

function convertRange(value: number, r2: number[], r1: number[] = [0, 1]): number {
  return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
}

export default CameraModule;
