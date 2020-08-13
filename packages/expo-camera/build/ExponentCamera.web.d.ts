import * as React from 'react';
import { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions } from './Camera.types';
export interface ExponentCameraRef {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
}
declare const ExponentCamera: React.ForwardRefExoticComponent<Pick<CameraNativeProps, "pointerEvents" | "style" | "zoom" | "ratio" | "focusDepth" | "type" | "onCameraReady" | "useCamera2Api" | "flashMode" | "whiteBalance" | "autoFocus" | "pictureSize" | "onMountError" | "barCodeScannerSettings" | "onBarCodeScanned" | "faceDetectorSettings" | "onFacesDetected" | "onFaceDetectionError" | "onPictureSaved" | "barCodeScannerEnabled" | "faceDetectorEnabled"> & React.RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
