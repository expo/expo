import { PermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';
export declare const MediaTypeOptions: {
    readonly All: "All";
    readonly Videos: "Videos";
    readonly Images: "Images";
};
export declare const ExportPresets: {
    readonly LowQuality: "LowQuality";
    readonly MediumQuality: "MediumQuality";
    readonly HighestQuality: "HighestQuality";
    readonly Passthrough: "Passthrough";
    readonly H264_640x480: "H264_640x480";
    readonly H264_960x540: "H264_960x540";
    readonly H264_1280x720: "H264_1280x720";
    readonly H264_1920x1080: "H264_1920x1080";
    readonly H264_3840x2160: "H264_3840x2160";
    readonly HEVC_1920x1080: "HEVC_1920x1080";
    readonly HEVC_3840x2160: "HEVC_3840x2160";
};
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
    mediaTypes?: typeof MediaTypeOptions[keyof typeof MediaTypeOptions];
    exif?: boolean;
    base64?: boolean;
    exportPreset?: typeof ExportPresets[keyof typeof ExportPresets];
};
export declare type OpenFileBrowserOptions = {
    mediaTypes: typeof MediaTypeOptions[keyof typeof MediaTypeOptions];
    capture?: boolean;
    allowsMultipleSelection: boolean;
};
export { PermissionResponse, PermissionStatus };
