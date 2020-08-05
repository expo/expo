import * as React from 'react';
import { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions } from './Camera.types';
export declare type ExponentCameraRef = {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
};
declare const ExponentCamera: React.ForwardRefExoticComponent<Pick<CameraNativeProps & {
    children?: any;
}, "type" | "pictureSize" | "pointerEvents" | "style" | "onCameraReady" | "onMountError" | "onBarCodeScanned" | "onFacesDetected" | "onFaceDetectionError" | "onPictureSaved" | "flashMode" | "autoFocus" | "focusDepth" | "zoom" | "whiteBalance" | "barCodeScannerSettings" | "barCodeScannerEnabled" | "faceDetectorEnabled" | "faceDetectorSettings" | "ratio" | "useCamera2Api" | "children"> & React.RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
