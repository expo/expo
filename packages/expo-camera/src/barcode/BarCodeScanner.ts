import { CameraPictureOptions, BarCodeSettings } from '../Camera.types';
import * as Utils from '../WebCameraUtils';
import BarcodeScannerWorker from './BarCodeScannerWorker';
import { WebWorker } from './WorkerUtils';

export default class BarCodeScanner {
  canvas?: HTMLCanvasElement;
  drawBarcodeOptions: any;
  private webWorker?: WebWorker;
  private barcodeLoop?: number;
  public isImageMirrored: boolean = false;

  constructor(private videoElement: HTMLVideoElement) {}

  private scanForBarcodes(types: string[], config: CameraPictureOptions = {}) {
    if (!this.webWorker) {
      throw new Error('Cannot process a barcode before the worker has been created.');
    }
    const image = Utils.captureImageData(this.videoElement, config);
    this.invokeWorker({ image, types, options: { inversionAttempts: 'dontInvert' } });
  }

  private invokeWorker(payload: any) {
    if (!this.webWorker || !payload) return;
    this.webWorker.postMessage({ module: 'expo-barcode-scanner', payload });
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
          }
        }
        // If interval is 0 then only scan once.
        if (settings.interval) {
          if (settings.interval < 0) {
            this.scanForBarcodes(settings.barCodeTypes);
          } else {
            // @ts-ignore: Type 'Timeout' is not assignable to type 'number'.
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
    clearTimeout(this.barcodeLoop);

    // Stop web-worker and clear the component
    if (this.webWorker) {
      this.webWorker.terminate();
      this.webWorker = undefined;
    }
    // Clear drawn bounds
    if (this.canvas) {
      const context = this.canvas.getContext('2d')!;
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

function scaleAspectFill(imgW: number, imgH: number, maxW: number, maxH: number): number {
  return Math.max(maxW / imgW, maxH / imgH);
}
