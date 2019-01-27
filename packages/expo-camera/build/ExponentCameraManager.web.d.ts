import { CapturedPicture, PictureOptions } from './Camera.types';
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
    takePicture(options: PictureOptions, camera: ExponentCamera): Promise<CapturedPicture>;
    pausePreview(camera: ExponentCamera): Promise<void>;
    resumePreview(camera: ExponentCamera): Promise<any>;
    getAvailablePictureSizes(ratio: string, camera: ExponentCamera): Promise<string[]>;
};
export default _default;
