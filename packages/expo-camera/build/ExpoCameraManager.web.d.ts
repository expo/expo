import { BarcodeType, BarcodeScanningResult, CameraCapturedPicture, CameraPictureOptions, PermissionResponse } from './Camera.types';
import { ExponentCameraRef } from './ExpoCamera.web';
declare const _default: {
    isModernBarcodeScannerAvailable: boolean;
    toggleRecordingAsyncAvailable: boolean;
    addListener(_eventName: string, _listener: (...args: any[]) => any): {
        remove: () => void;
    };
    readonly Type: {
        back: string;
        front: string;
    };
    readonly FlashMode: {
        on: string;
        off: string;
        auto: string;
        torch: string;
        screen: string;
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
    scanFromURLAsync(url: string, barcodeTypes?: BarcodeType[]): Promise<BarcodeScanningResult[]>;
};
export default _default;
//# sourceMappingURL=ExpoCameraManager.web.d.ts.map