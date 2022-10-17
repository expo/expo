import * as React from 'react';
import { BarCodeScanningResult, CameraPictureOptions, MountErrorListener } from './Camera.types';
export declare function useWebZXingBarcodeScanner(video: React.MutableRefObject<HTMLVideoElement | null>, { barCodeTypes, isEnabled, captureOptions, interval, onScanned, onError, }: {
    barCodeTypes: string[];
    isEnabled: boolean;
    captureOptions: Pick<CameraPictureOptions, 'scale' | 'isImageMirror'>;
    interval?: number;
    onScanned?: (scanningResult: {
        nativeEvent: BarCodeScanningResult;
    }) => void;
    onError?: MountErrorListener;
}): void;
//# sourceMappingURL=useWebZXingBarcodeScanner.d.ts.map