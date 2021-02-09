import * as React from 'react';
import { CameraPictureOptions } from './Camera';
import { BarCodeScanningResult, MountErrorListener } from './Camera.types';
export declare function useWebQRScanner(video: React.MutableRefObject<HTMLVideoElement | null>, { isEnabled, captureOptions, interval, onScanned, onError, }: {
    isEnabled: boolean;
    captureOptions: Pick<CameraPictureOptions, 'scale' | 'isImageMirror'>;
    interval?: number;
    onScanned?: (scanningResult: {
        nativeEvent: BarCodeScanningResult;
    }) => void;
    onError?: MountErrorListener;
}): void;
