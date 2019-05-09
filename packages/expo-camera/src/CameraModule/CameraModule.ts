import invariant from 'invariant';

import { PictureOptions } from '../Camera.types';
import {
  CameraType,
  CapturedPicture,
  CaptureOptions,
  BarCodeSettings,
  ImageType,
} from './CameraModule.types';
import * as Utils from './CameraUtils';
import { FacingModeToCameraType, PictureSizes } from './constants';
import * as CapabilityUtils from './CapabilityUtils';

import { WebWorker } from './barcode/WorkerUtils';

import BarcodeScannerWorker from './barcode/BarcodeScannerWorker.js';

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
  canvas?: HTMLCanvasElement;

  stream: MediaStream | null = null;
  settings: MediaTrackSettings | null = null;
  drawBarcodeOptions: any;
  onCameraReady: OnCameraReadyListener = () => {};
  onMountError: OnMountErrorListener = () => {};

  private _pictureSize?: string;
  private _isStartingCamera = false;
  private _autoFocus: string = 'continuous';
  private _flashMode: string = 'off';
  private _whiteBalance: string = 'continuous';
  private _cameraType: CameraType = CameraType.front;
  private _zoom: number = 1;

  private webWorker?: WebWorker;
  private barcodeLoop?: NodeJS.Timeout;

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

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    if (this.videoElement) {
      this.videoElement.addEventListener('loadedmetadata', () => {
        this._syncTrackCapabilities();
      });
    }
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

  private async _syncTrackCapabilities(): Promise<void> {
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

  private isImageMirrored: boolean = true;
  getActualCameraType(): CameraType | null {
    if (this.settings) {
      // On desktop no value will be returned, in this case we should assume the cameraType is 'front'
      const { facingMode = 'user' } = this.settings;
      this.isImageMirrored = facingMode === 'user';
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

  startScanner(settings: BarCodeSettings, callback: (results: any) => void) {
    if (this.webWorker) {
      this.stopScanner();
    }
    // Initiate web worker execute handler according to mode.
    this.webWorker = new WebWorker(BarcodeScannerWorker);

    this.webWorker.onmessage = event => {
      if (callback && this.webWorker) {
        if (event && Array.isArray(event.data)) {
          let context: CanvasRenderingContext2D | undefined;
          if (settings.shouldRenderIndicator && this.canvas) {
            const { videoWidth, videoHeight } = this.videoElement;
            const elementWidth: number = this.videoElement.offsetWidth;
            const elementHeight: number = this.videoElement.offsetHeight;

            const videoRatio = scaleAspectFill(
              videoWidth,
              videoHeight,
              elementWidth,
              elementHeight
            );
            // let videoRatio = scalePreserveAspectRatio(videoWidth, videoHeight, elementWidth, elementHeight);

            this.canvas.width = elementWidth;
            this.canvas.height = elementHeight;

            const dW = videoWidth * videoRatio;
            const dH = videoHeight * videoRatio;

            const diffW = elementWidth - dW;
            const diffH = elementHeight - dH;
            const xScale = (elementWidth - diffW) / videoWidth;
            const yScale = (elementHeight - diffH) / videoHeight;

            const xOffset = diffW * 0.5;
            const yOffset = diffH * 0.5;

            context = this.canvas.getContext('2d')!;
            context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            context.save();
            if (this.isImageMirrored) {
              context.setTransform(-1, 0, 0, 1, this.canvas.width, 0);
            }

            // DEBUG: Screen bounds
            // context.strokeStyle = 'rgba(200, 0, 0, 1)';
            // context.strokeRect(20, 20, this.canvas.width - 40, this.canvas.height - 40);

            context.save();
            context.translate(xOffset, yOffset);
            context.scale(xScale, yScale);

            // DEBUG: If this doesn't match the edges, something is wrong
            // context.strokeStyle = 'rgba(0, 200, 0, 1)';
            // context.strokeRect(0, 0, videoWidth, videoHeight);
          }
          for (const result of event.data) {
            if (context) {
              Utils.drawBarcodeBounds(context, result.location, this.drawBarcodeOptions);
            }
            callback(result);
          }

          if (context) {
            // Restore the transform
            context.restore();
            context.restore();
          }
        }
        // If interval is 0 then only scan once.
        if (settings.interval) {
          if (settings.interval < 0) {
            // @ts-ignore
            this.barcodeLoop = requestAnimationFrame(() => {
              this.scanForBarcodes(settings.barCodeTypes);
            });
          } else {
            // @ts-ignore
            this.barcodeLoop = setTimeout(() => {
              this.scanForBarcodes(settings.barCodeTypes);
            }, settings.interval);
          }
        }
        return;
      }

      this.stopScanner();
    };

    // Invoke the initial scan
    this.scanForBarcodes(settings.barCodeTypes);
  }

  stopScanner() {
    // Stop web-worker and clear the component
    if (this.webWorker) {
      this.webWorker.terminate();
      this.webWorker = undefined;
    }

    // @ts-ignore
    clearTimeout(this.barcodeLoop);
  }

  private scanForBarcodes(types: string[], config: PictureOptions = {}) {
    if (!this.webWorker) {
      throw new Error('Cannot process a barcode before the worker has been created.');
    }
    const image = Utils.captureImageData(this.videoElement, config);
    // this.canvas.drawImage
    this.invokeWorker({ image, types, options: { inversionAttempts: 'dontInvert' } });
  }

  private invokeWorker(payload: any) {
    if (!this.webWorker || !payload) return;
    this.webWorker.postMessage({ module: 'expo-barcode-scanner', payload });
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

  unmount() {
    this.stopScanner();
    this.settings = null;
    this.stream = null;
  }
}

export default CameraModule;

function scalePreserveAspectRatio(imgW, imgH, maxW, maxH) {
  return Math.min(maxW / imgW, maxH / imgH);
}
function scaleAspectFill(imgW, imgH, maxW, maxH) {
  return Math.max(maxW / imgW, maxH / imgH);
}
