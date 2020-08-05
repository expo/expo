import { CameraCapturedPicture, CameraPictureOptions } from './Camera.types';
import ExponentCamera from './ExponentCamera.web';
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
    takePicture(options: CameraPictureOptions, camera: typeof ExponentCamera): Promise<CameraCapturedPicture>;
    pausePreview(camera: typeof ExponentCamera): Promise<void>;
    resumePreview(camera: typeof ExponentCamera): Promise<any>;
    getAvailableCameraTypesAsync(): Promise<string[]>;
    getAvailablePictureSizes(ratio: string, camera: typeof ExponentCamera): Promise<string[]>;
};
export default _default;
