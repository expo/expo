import { CameraType, ImageType } from './CameraModule.types';
export declare const VIDEO_ASPECT_RATIOS: {
    '3840x2160': number;
    '1920x1080': number;
    '1280x720': number;
    '640x480': number;
    '352x288': number;
};
export declare const PictureSizes: string[];
export declare const ImageTypeFormat: {
    [ImageType.jpg]: string;
    [ImageType.png]: string;
};
export declare const MinimumConstraints: MediaStreamConstraints;
export declare const CameraTypeToFacingMode: {
    [CameraType.front]: string;
    [CameraType.back]: string;
};
export declare const FacingModeToCameraType: {
    user: CameraType;
    environment: CameraType;
};
