import * as React from 'react';
import { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions } from './Camera.types';
export interface ExponentCameraRef {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
}
declare const ExponentCamera: React.ForwardRefExoticComponent<Pick<CameraNativeProps, "type" | "pictureSize" | "poster" | "pointerEvents" | "style" | "onCameraReady" | "onMountError" | "onBarCodeScanned" | "onFacesDetected" | "onFaceDetectionError" | "onPictureSaved" | "flashMode" | "autoFocus" | "focusDepth" | "zoom" | "defaultRecordOptions" | "whiteBalance" | "barCodeScannerSettings" | "faceDetectorSettings" | "barCodeScannerEnabled" | "faceDetectorEnabled" | "ratio" | "useCamera2Api"> & React.RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
//# sourceMappingURL=ExponentCamera.web.d.ts.map