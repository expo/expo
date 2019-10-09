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
export declare const PermissionsStatus: {
    readonly GRANTED: "granted";
    readonly UNDETERMINED: "undetermined";
    readonly DENIED: "denied";
};
export declare type PermissionsResponse = {
    status: typeof PermissionsStatus[keyof typeof PermissionsStatus];
    expires: "never" | number;
    granted: boolean;
    neverAskAgain: boolean;
};
