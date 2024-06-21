import { CameraCapturedPicture, CameraPictureOptions, PermissionResponse } from './legacy/Camera.types';
import { ExponentCameraRef } from './legacy/ExpoCamera.web';
declare const _default: {
    readonly Type: {
        back: string;
        front: string;
    };
    readonly FlashMode: {
        on: string;
        off: string;
        auto: string;
        torch: string;
    };
    readonly AutoFocus: {
        on: string;
        off: string;
        auto: string;
        singleShot: string;
    };
    readonly WhiteBalance: {
        auto: string;
        continuous: string;
        manual: string;
    };
    readonly VideoQuality: {};
    readonly VideoStabilization: {};
    isAvailableAsync(): Promise<boolean>;
    takePicture(options: CameraPictureOptions, camera: ExponentCameraRef): Promise<CameraCapturedPicture>;
    pausePreview(camera: ExponentCameraRef): Promise<void>;
    resumePreview(camera: ExponentCameraRef): Promise<void>;
    getAvailableCameraTypesAsync(): Promise<string[]>;
    getAvailablePictureSizes(ratio: string, camera: ExponentCameraRef): Promise<string[]>;
    getPermissionsAsync(): Promise<PermissionResponse>;
    requestPermissionsAsync(): Promise<PermissionResponse>;
    getCameraPermissionsAsync(): Promise<PermissionResponse>;
    requestCameraPermissionsAsync(): Promise<PermissionResponse>;
    getMicrophonePermissionsAsync(): Promise<PermissionResponse>;
    requestMicrophonePermissionsAsync(): Promise<PermissionResponse>;
};
export default _default;
//# sourceMappingURL=ExpoCameraManager.web.d.ts.map