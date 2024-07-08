import { type PropsWithChildren } from 'react';
import { CameraNativeProps, CameraCapturedPicture } from './Camera.types';
import { CameraPictureOptions } from './legacy/Camera.types';
export interface ExponentCameraRef {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
}
declare const ExponentCamera: import("react").ForwardRefExoticComponent<Pick<PropsWithChildren<CameraNativeProps>, "facing" | "poster" | "pointerEvents" | "style" | "onCameraReady" | "onMountError" | "onBarcodeScanned" | "onPictureSaved" | "onResponsiveOrientationChanged" | "flashMode" | "enableTorch" | "animateShutter" | "autoFocus" | "mute" | "zoom" | "ratio" | "barcodeScannerSettings" | "barcodeScannerEnabled" | "responsiveOrientationWhenOrientationLocked" | "children"> & import("react").RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
//# sourceMappingURL=ExpoCamera.web.d.ts.map