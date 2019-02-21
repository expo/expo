export declare enum CameraType {
    front = "front",
    back = "back"
}
export declare enum ImageType {
    png = "png",
    jpg = "jpg"
}
export declare type ImageParameters = {
    imageType: ImageType;
    quality: number | null;
};
export declare type ImageSize = {
    width: number;
    height: number;
};
export declare type CaptureOptions = {
    quality?: number;
    exif?: boolean;
    onPictureSaved?: Function;
    skipProcessing?: boolean;
    scale: number;
    imageType: ImageType;
    isImageMirror: boolean;
};
export declare type CapturedPicture = {
    width: number;
    height: number;
    uri: string;
    base64?: string;
    exif?: any;
};
