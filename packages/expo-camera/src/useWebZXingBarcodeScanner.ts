import { useWorker } from '@koale/useworker';
import * as React from 'react';

import { BarCodeScanningResult, CameraPictureOptions, MountErrorListener } from './Camera.types';
import { captureImageData } from './WebCameraUtils';

const barcodeWorkerMethod = (
  barCodeTypes: string[],
  { data, width, height }: ImageData
): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      const {
        BarcodeFormat,
        BinaryBitmap,
        DecodeHintType,
        HybridBinarizer,
        MultiFormatReader,
        RGBLuminanceSource,
      } = (self as any).ZXing;

      const toLuminanceBuffer = (imageBuffer: Uint8ClampedArray, width: number, height: number) => {
        const luminanceBuffer = new Uint8ClampedArray(width * height);
        for (let i = 0, j = 0, length = imageBuffer.length; i < length; i += 4, j++) {
          let luminance: number;
          const alpha = imageBuffer[i + 3];
          if (alpha === 0) {
            luminance = 0xff;
          } else {
            const r = imageBuffer[i];
            const g = imageBuffer[i + 1];
            const b = imageBuffer[i + 2];
            luminance = (306 * r + 601 * g + 117 * b) >> 10;
          }
          luminanceBuffer[j] = luminance;
        }
        return luminanceBuffer;
      };
      const luminanceBuffer = toLuminanceBuffer(data, width, height);

      const luminanceSource = new RGBLuminanceSource(luminanceBuffer, width, height);

      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

      const hints = new Map();
      hints.set(
        DecodeHintType.POSSIBLE_FORMATS,
        [
          barCodeTypes.includes('aztec') && BarcodeFormat.AZTEC,
          barCodeTypes.includes('codabar') && BarcodeFormat.CODABAR,
          barCodeTypes.includes('code39') && BarcodeFormat.CODE_39,
          barCodeTypes.includes('code128') && BarcodeFormat.CODE_128,
          barCodeTypes.includes('datamatrix') && BarcodeFormat.DATAMATRIX,
          barCodeTypes.includes('ean8') && BarcodeFormat.EAN_8,
          barCodeTypes.includes('ean13') && BarcodeFormat.EAN_13,
          barCodeTypes.includes('interleaved2of5') && BarcodeFormat.ITF,
          barCodeTypes.includes('pdf417') && BarcodeFormat.PDF_417,
          barCodeTypes.includes('qr') && BarcodeFormat.QR_CODE,
          barCodeTypes.includes('upc_a') && BarcodeFormat.UPC_A,
          barCodeTypes.includes('upc_e') && BarcodeFormat.UPC_E,
        ].filter((e) => e)
      );

      const reader = new MultiFormatReader(hints);

      const result = reader.decode(binaryBitmap, hints);

      const type =
        result.getBarcodeFormat() === BarcodeFormat.AZTEC
          ? 'aztec'
          : result.getBarcodeFormat() === BarcodeFormat.CODABAR
          ? 'codabar'
          : result.getBarcodeFormat() === BarcodeFormat.CODE_39
          ? 'code39'
          : result.getBarcodeFormat() === BarcodeFormat.CODE_128
          ? 'code128'
          : result.getBarcodeFormat() === BarcodeFormat.DATAMATRIX
          ? 'datamatrix'
          : result.getBarcodeFormat() === BarcodeFormat.EAN_8
          ? 'ean8'
          : result.getBarcodeFormat() === BarcodeFormat.EAN_13
          ? 'ean13'
          : result.getBarcodeFormat() === BarcodeFormat.ITF
          ? 'interleaved2of5'
          : result.getBarcodeFormat() === BarcodeFormat.PDF_417
          ? 'pdf417'
          : result.getBarcodeFormat() === BarcodeFormat.QR_CODE
          ? 'qr'
          : result.getBarcodeFormat() === BarcodeFormat.UPC_A
          ? 'upc_a'
          : result.getBarcodeFormat() === BarcodeFormat.UPC_E
          ? 'upc_e'
          : `Unknown format (${result.getBarcodeFormat()})`;

      const nativeEvent: BarCodeScanningResult = {
        type,
        data: result.getText(),
        cornerPoints: [],
        bounds: { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
      };
      resolve(nativeEvent);
    } catch (e) {
      if (e.constructor.name === 'NotFoundException') {
        return resolve(undefined);
      } else if (e.constructor.name === 'ChecksumException') {
        return resolve(undefined);
      } else if (e.constructor.name === 'FormatException') {
        return resolve(undefined);
      }
      console.error(e);
    }
  });
};

function useRemoteJavascriptBarcodeReader() {
  return useWorker(barcodeWorkerMethod, {
    remoteDependencies: ['https://cdn.jsdelivr.net/npm/@zxing/library@0.19.1/umd/index.js'],
    autoTerminate: false,
  });
}

export function useWebZXingBarcodeScanner(
  video: React.MutableRefObject<HTMLVideoElement | null>,
  {
    barCodeTypes,
    isEnabled,
    captureOptions,
    interval,
    onScanned,
    onError,
  }: {
    barCodeTypes: string[];
    isEnabled: boolean;
    captureOptions: Pick<CameraPictureOptions, 'scale' | 'isImageMirror'>;
    interval?: number;
    onScanned?: (scanningResult: { nativeEvent: BarCodeScanningResult }) => void;
    onError?: MountErrorListener;
  }
) {
  const isRunning = React.useRef<boolean>(false);
  const timeout = React.useRef<number | undefined>(undefined);

  const [decode, clearWorker] = useRemoteJavascriptBarcodeReader();

  async function scanAsync() {
    // If interval is 0 then only scan once.
    if (!isRunning.current || !onScanned) {
      stop();
      return;
    }
    try {
      const data = captureImageData(video.current, captureOptions);

      if (data) {
        const nativeEvent: BarCodeScanningResult | any = await decode(barCodeTypes, data);
        if (nativeEvent?.data) {
          onScanned({
            nativeEvent,
          });
        }
      }
    } catch (error) {
      if (onError) {
        onError({ nativeEvent: error });
      }
    } finally {
      // If interval is 0 then only scan once.
      if (interval === 0) {
        stop();
        return;
      }
      const intervalToUse = !interval || interval < 0 ? 16 : interval;
      // @ts-ignore: Type 'Timeout' is not assignable to type 'number'
      timeout.current = setTimeout(() => {
        scanAsync();
      }, intervalToUse);
    }
  }

  function stop() {
    isRunning.current = false;
    clearTimeout(timeout.current);
  }

  React.useEffect(() => {
    if (isEnabled) {
      isRunning.current = true;
      scanAsync();
    } else {
      stop();
    }
  }, [isEnabled]);

  React.useEffect(() => {
    return () => {
      stop();
      clearWorker.kill();
    };
  }, []);
}
