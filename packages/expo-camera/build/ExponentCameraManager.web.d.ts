import { PictureOptions, CapturedPicture } from './Camera.types';
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
    };
    readonly AutoFocus: {
        on: string;
        off: string;
        auto: string;
    };
    readonly WhiteBalance: {
        auto: string;
    };
    readonly VideoQuality: {};
    takePicture(options: PictureOptions, camera: any): Promise<CapturedPicture>;
    pausePreview(camera: any): Promise<any>;
    resumePreview(camera: any): Promise<any>;
    setFacingMode(camera: any, facingMode: string): Promise<any>;
};
export default _default;
