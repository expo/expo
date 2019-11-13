import { PermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';
export declare enum MediaTypeOptions {
    All = "All",
    Videos = "Videos",
    Images = "Images"
}
export declare type NativeImageInfo = {
    type: 'image';
    uri: string;
    width: number;
    height: number;
    exif?: Record<string, any>;
    base64?: string;
};
export declare type NativeVideoInfo = {
    type: 'video';
    uri: string;
    width: number;
    height: number;
    duration: number;
};
export declare type WebImageInfo = {
    uri: string;
    width: 0;
    height: 0;
};
export declare type ImageInfo = NativeImageInfo | NativeVideoInfo | WebImageInfo;
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
};
export declare type OpenFileBrowserOptions = {
    mediaTypes: MediaTypeOptions;
    capture?: boolean;
    allowsMultipleSelection: boolean;
};
export { PermissionResponse, PermissionStatus };
