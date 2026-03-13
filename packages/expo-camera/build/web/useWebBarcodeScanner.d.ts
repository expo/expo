import * as React from 'react';
import { BarcodeType, BarcodeScanningResult, MountErrorListener } from '../Camera.types';
export declare function useWebBarcodeScanner(video: React.RefObject<HTMLVideoElement | null>, { isEnabled, barcodeTypes, interval, isMirrored, onScanned, onError, }: {
    isEnabled: boolean;
    barcodeTypes: BarcodeType[];
    interval?: number;
    isMirrored?: boolean;
    onScanned?: (scanningResult: {
        nativeEvent: BarcodeScanningResult;
    }) => void;
    onError?: MountErrorListener;
}): void;
//# sourceMappingURL=useWebBarcodeScanner.d.ts.map