import * as React from 'react';
import { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions } from './legacy/Camera.types';
export interface ExponentCameraRef {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
}
declare const ExponentCamera: React.ForwardRefExoticComponent<Pick<CameraNativeProps & {
    children?: React.ReactNode;
}, "type" | "flashMode" | "children" | "pointerEvents" | "style" | "zoom" | "pictureSize" | "poster" | "responsiveOrientationWhenOrientationLocked" | "ratio" | "onCameraReady" | "onMountError" | "onResponsiveOrientationChanged" | "onPictureSaved" | "autoFocus" | "whiteBalance" | "onBarCodeScanned" | "onFacesDetected" | "onFaceDetectionError" | "focusDepth" | "barCodeScannerSettings" | "faceDetectorSettings" | "barCodeScannerEnabled" | "faceDetectorEnabled" | "useCamera2Api"> & React.RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
//# sourceMappingURL=ExpoCamera.web.d.ts.map