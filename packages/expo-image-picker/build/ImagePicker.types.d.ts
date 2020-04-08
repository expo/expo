export declare enum MediaTypeOptions {
    All = "All",
    Videos = "Videos",
    Images = "Images"
}
export declare enum VideoExportPreset {
    Passthrough = 0,
    LowQuality = 1,
    MediumQuality = 2,
    HighestQuality = 3,
    H264_640x480 = 4,
    H264_960x540 = 5,
    H264_1280x720 = 6,
    H264_1920x1080 = 7,
    H264_3840x2160 = 8,
    HEVC_1920x1080 = 9,
    HEVC_3840x2160 = 10
}
export declare type ImageInfo = {
    uri: string;
    width: number;
    height: number;
    type?: 'image' | 'video';
    exif?: {
        [key: string]: any;
    };
    base64?: string;
};
export declare type ImagePickerResult = {
    cancelled: true;
} | ({
    cancelled: false;
} & ImageInfo);
export declare type ImagePickerOptions = {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    allowsMultipleSelection?: boolean;
    mediaTypes?: MediaTypeOptions;
    exif?: boolean;
    base64?: boolean;
    videoExportPreset?: VideoExportPreset;
};
export declare type OpenFileBrowserOptions = {
    mediaTypes: MediaTypeOptions;
    capture?: boolean;
    allowsMultipleSelection: boolean;
};
