import * as React from 'react';
import { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions } from './Camera.types';
export interface ExponentCameraRef {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
}
declare const ExponentCamera: React.ForwardRefExoticComponent<Pick<CameraNativeProps & {
    children?: React.ReactNode;
}, "zoom" | "type" | "enableTorch" | "flashMode" | "children" | "pointerEvents" | "style" | "onCameraReady" | "onMountError" | "barCodeScannerSettings" | "onBarCodeScanned" | "poster" | "responsiveOrientationWhenOrientationLocked" | "onResponsiveOrientationChanged" | "onPictureSaved" | "barCodeScannerEnabled"> & React.RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
//# sourceMappingURL=ExpoCamera.web.d.ts.map