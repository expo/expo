import { CameraCapturedPicture, CameraPictureOptions } from './Camera.types';
import { ExponentCameraRef } from './ExponentCamera.web';
declare const _default: {
    readonly name: string;
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
    isAvailableAsync(): Promise<boolean>;
    takePicture(options: CameraPictureOptions, camera: ExponentCameraRef): Promise<CameraCapturedPicture>;
    pausePreview(camera: ExponentCameraRef): Promise<void>;
    resumePreview(camera: ExponentCameraRef): Promise<void>;
    getAvailableCameraTypesAsync(): Promise<string[]>;
    getAvailablePictureSizes(ratio: string, camera: ExponentCameraRef): Promise<string[]>;
};
export default _default;
