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
}, "autoFocus" | "flashMode" | "whiteBalance" | "zoom" | "onCameraReady" | "onMountError" | "type" | "poster" | "pointerEvents" | "style" | "onBarCodeScanned" | "onPictureSaved" | "onResponsiveOrientationChanged" | "barCodeScannerSettings" | "barCodeScannerEnabled" | "responsiveOrientationWhenOrientationLocked" | "children" | "pictureSize" | "onFacesDetected" | "onFaceDetectionError" | "focusDepth" | "faceDetectorSettings" | "faceDetectorEnabled" | "ratio" | "useCamera2Api"> & React.RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
//# sourceMappingURL=ExponentCamera.web.d.ts.map