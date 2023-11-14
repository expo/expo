import * as React from 'react';
import { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions } from '../Camera.types';
export interface ExponentCameraRef {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
}
declare const ExponentCamera: React.ForwardRefExoticComponent<Pick<CameraNativeProps & {
    children?: React.ReactNode;
}, "type" | "flashMode" | "autoFocus" | "whiteBalance" | "children" | "pointerEvents" | "style" | "zoom" | "ratio" | "focusDepth" | "onCameraReady" | "useCamera2Api" | "pictureSize" | "onMountError" | "barCodeScannerSettings" | "onBarCodeScanned" | "faceDetectorSettings" | "onFacesDetected" | "poster" | "responsiveOrientationWhenOrientationLocked" | "onResponsiveOrientationChanged" | "onFaceDetectionError" | "onPictureSaved" | "barCodeScannerEnabled" | "faceDetectorEnabled"> & React.RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
//# sourceMappingURL=ExpoCamera.web.d.ts.map