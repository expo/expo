import * as React from 'react';

import * as WebBarcodeScanner from './WebBarcodeScanner';
import { BarcodeType, BarcodeScanningResult, MountErrorListener } from '../Camera.types';

function mapToViewCoordinates(
  result: BarcodeScanningResult,
  videoWidth: number,
  viewHeight: number,
  height: number,
  width: number,
  isMirrored: boolean
): BarcodeScanningResult {
  const scaleX = width / videoWidth;
  const scaleY = viewHeight / height;

  const mapPoint = (p: { x: number; y: number }) => {
    const x = isMirrored ? width - p.x * scaleX : p.x * scaleX;
    const y = p.y * scaleY;
    return { x, y };
  };

  const origin = mapPoint(result.bounds.origin);
  const size = {
    width: result.bounds.size.width * scaleX,
    height: result.bounds.size.height * scaleY,
  };

  if (isMirrored) {
    origin.x -= size.width;
  }

  return {
    ...result,
    bounds: { origin, size },
    cornerPoints: result.cornerPoints.map(mapPoint),
  };
}

export function useWebBarcodeScanner(
  video: React.RefObject<HTMLVideoElement | null>,
  {
    isEnabled,
    barcodeTypes,
    interval,
    isMirrored = false,
    onScanned,
    onError,
  }: {
    isEnabled: boolean;
    barcodeTypes: BarcodeType[];
    interval?: number;
    isMirrored?: boolean;
    onScanned?: (scanningResult: { nativeEvent: BarcodeScanningResult }) => void;
    onError?: MountErrorListener;
  }
) {
  const isRunning = React.useRef<boolean>(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  async function scanAsync() {
    if (!isRunning.current || !onScanned) {
      stop();
      return;
    }
    try {
      const videoEl = video.current;
      if (!videoEl || videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) {
        return;
      }

      const { videoWidth, videoHeight } = videoEl;
      if (!videoWidth || !videoHeight) {
        return;
      }

      const bitmap = await createImageBitmap(videoEl);
      const results = await WebBarcodeScanner.detect(bitmap, barcodeTypes);
      bitmap.close();

      const viewWidth = videoEl.clientWidth || videoWidth;
      const viewHeight = videoEl.clientHeight || videoHeight;

      for (const raw of results) {
        const nativeEvent = mapToViewCoordinates(
          raw,
          videoWidth,
          videoHeight,
          viewWidth,
          viewHeight,
          isMirrored
        );
        onScanned({ nativeEvent });
      }
    } catch (error: any) {
      if (onError) {
        onError({ nativeEvent: error });
      }
    } finally {
      if (interval === 0) {
        stop();
        return;
      }
      const intervalToUse = !interval || interval < 0 ? 16 : interval;
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
    }

    return () => {
      if (isEnabled) {
        stop();
      }
    };
  }, [isEnabled]);
}
