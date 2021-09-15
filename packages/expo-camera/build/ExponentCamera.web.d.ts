import * as React from 'react';
import { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions } from './Camera.types';
export interface ExponentCameraRef {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
}
declare const ExponentCamera: React.ForwardRefExoticComponent<Pick<CameraNativeProps, "pointerEvents" | "style" | "onCameraReady" | "onMountError" | "onBarCodeScanned" | "onFacesDetected" | "onFaceDetectionError" | "onPictureSaved" | "type" | "flashMode" | "autoFocus" | "focusDepth" | "zoom" | "whiteBalance" | "pictureSize" | "barCodeScannerSettings" | "faceDetectorSettings" | "barCodeScannerEnabled" | "faceDetectorEnabled" | "ratio" | "useCamera2Api" | "poster"> & React.RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
