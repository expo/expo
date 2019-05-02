export declare enum MediaTypeOptions {
    All = "All",
    Videos = "Videos",
    Images = "Images"
}
export declare type ImageInfo = {
    uri: string;
    width: number;
    height: number;
    type?: 'image' | 'video';
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
};
export declare type OpenFileBrowserOptions = {
    mediaTypes: MediaTypeOptions;
    capture?: boolean;
    allowsMultipleSelection: boolean;
};
