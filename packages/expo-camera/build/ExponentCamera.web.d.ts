import * as React from 'react';
import { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions } from './Camera.types';
export interface ExponentCameraRef {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
}
declare const ExponentCamera: React.ForwardRefExoticComponent<Pick<CameraNativeProps, "type" | "pictureSize" | "pointerEvents" | "style" | "onCameraReady" | "onMountError" | "onBarCodeScanned" | "onFacesDetected" | "onFaceDetectionError" | "onPictureSaved" | "flashMode" | "autoFocus" | "focusDepth" | "zoom" | "whiteBalance" | "barCodeScannerSettings" | "faceDetectorSettings" | "ratio" | "useCamera2Api"> & React.RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
