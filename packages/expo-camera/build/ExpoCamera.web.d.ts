import React from 'react';
import { CameraNativeProps, CameraCapturedPicture } from './Camera.types';
import { CameraPictureOptions } from './legacy/Camera.types';
export interface ExponentCameraRef {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
}
declare const ExponentCamera: React.ForwardRefExoticComponent<Pick<React.PropsWithChildren<CameraNativeProps>, "facing" | "flashMode" | "children" | "pointerEvents" | "style" | "zoom" | "mute" | "animateShutter" | "enableTorch" | "barcodeScannerSettings" | "poster" | "responsiveOrientationWhenOrientationLocked" | "ratio" | "onCameraReady" | "onMountError" | "onBarcodeScanned" | "onResponsiveOrientationChanged" | "onPictureSaved" | "autoFocus" | "barcodeScannerEnabled"> & React.RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
//# sourceMappingURL=ExpoCamera.web.d.ts.map