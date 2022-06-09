import { useWorker } from '@koale/useworker';
import * as React from 'react';

import { BarCodeScanningResult, CameraPictureOptions, MountErrorListener } from './Camera.types';
import { captureImageData } from './WebCameraUtils';

const qrWorkerMethod = ({ data, width, height }: ImageData): any => {
  // eslint-disable-next-line no-undef
  const decoded = (self as any).jsQR(data, width, height, {
    inversionAttempts: 'attemptBoth',
  });

  let parsed;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    parsed = decoded;
  }

  if (parsed?.data) {
    const nativeEvent: BarCodeScanningResult = {
      type: 'qr',
      data: parsed.data,
    };
    if (parsed.location) {
      nativeEvent.cornerPoints = [
        parsed.location.topLeftCorner,
        parsed.location.bottomLeftCorner,
        parsed.location.topRightCorner,
        parsed.location.bottomRightCorner,
      ];
    }
    return nativeEvent;
  }
  return parsed;
};

function useRemoteJsQR() {
  return useWorker(qrWorkerMethod, {
    remoteDependencies: ['https://cdn.jsdelivr.net/npm/jsqr@1.2.0/dist/jsQR.min.js'],
    timeout: 5000,
  });
}

export function useWebQRScanner(
  video: React.MutableRefObject<HTMLVideoElement | null>,
  {
    isEnabled,
    captureOptions,
    interval,
    onScanned,
    onError,
  }: {
    isEnabled: boolean;
    captureOptions: Pick<CameraPictureOptions, 'scale' | 'isImageMirror'>;
    interval?: number;
    onScanned?: (scanningResult: { nativeEvent: BarCodeScanningResult }) => void;
    onError?: MountErrorListener;
  }
) {
  const isRunning = React.useRef<boolean>(false);
  const timeout = React.useRef<number | undefined>(undefined);

  const [decode, clearWorker] = useRemoteJsQR();

  async function scanAsync() {
    // If interval is 0 then only scan once.
    if (!isRunning.current || !onScanned) {
      stop();
      return;
    }
    try {
      const data = captureImageData(video.current, captureOptions);

      if (data) {
        const nativeEvent: BarCodeScanningResult | any = await decode(data);
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
