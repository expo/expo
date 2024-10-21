import * as React from 'react';
import { BarcodeScanningResult, CameraPictureOptions, MountErrorListener } from '../Camera.types';
export declare function useWebQRScanner(video: React.MutableRefObject<HTMLVideoElement | null>, { isEnabled, captureOptions, interval, onScanned, onError, }: {
    isEnabled: boolean;
    captureOptions: Pick<CameraPictureOptions, 'scale' | 'isImageMirror'>;
    interval?: number;
    onScanned?: (scanningResult: {
        nativeEvent: BarcodeScanningResult;
    }) => void;
    onError?: MountErrorListener;
}): void;
//# sourceMappingURL=useWebQRScanner.d.ts.map