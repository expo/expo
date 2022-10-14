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
}, "onPictureSaved" | "type" | "pictureSize" | "poster" | "pointerEvents" | "style" | "onCameraReady" | "onMountError" | "onBarCodeScanned" | "onFacesDetected" | "onFaceDetectionError" | "flashMode" | "autoFocus" | "focusDepth" | "zoom" | "whiteBalance" | "barCodeScannerSettings" | "faceDetectorSettings" | "barCodeScannerEnabled" | "faceDetectorEnabled" | "ratio" | "useCamera2Api" | "children"> & React.RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
//# sourceMappingURL=ExponentCamera.web.d.ts.map