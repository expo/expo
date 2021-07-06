import { PermissionResponse } from 'expo-modules-core';
export { PermissionResponse as CameraPermissionResponse };
export declare type MediaLibraryPermissionResponse = PermissionResponse & {
    accessPrivileges?: 'all' | 'limited' | 'none';
};
/**
 * @deprecated Use `ImagePicker.MediaLibraryPermissionResponse`
 */
export declare type CameraRollPermissionResponse = MediaLibraryPermissionResponse;
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
export declare enum UIImagePickerControllerQualityType {
    High = 0,
    Medium = 1,
    Low = 2,
    VGA640x480 = 3,
    IFrame1280x720 = 4,
    IFrame960x540 = 5
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
export declare type ImagePickerErrorResult = {
    code: string;
    message: string;
    exception?: string;
};
export declare type ImagePickerResult = {
    cancelled: true;
} | ({
    cancelled: false;
} & ImageInfo);
export declare type ImagePickerMultipleResult = {
    cancelled: true;
} | {
    cancelled: false;
    selected: ImageInfo[];
};
export declare type ImagePickerOptions = {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    mediaTypes?: MediaTypeOptions;
    exif?: boolean;
    base64?: boolean;
    /**
     * @deprecated see [iOS videoExportPreset](https://developer.apple.com/documentation/uikit/uiimagepickercontroller/2890964-videoexportpreset?language=objc)
     */
    videoExportPreset?: VideoExportPreset;
    videoQuality?: UIImagePickerControllerQualityType;
    allowsMultipleSelection?: boolean;
    videoMaxDuration?: number;
};
export declare type OpenFileBrowserOptions = {
    mediaTypes: MediaTypeOptions;
    capture?: boolean;
    allowsMultipleSelection: boolean;
    base64: boolean;
};
export declare type ExpandImagePickerResult<T extends ImagePickerOptions | OpenFileBrowserOptions> = T extends {
    allowsMultipleSelection: true;
} ? ImagePickerMultipleResult : ImagePickerResult;
