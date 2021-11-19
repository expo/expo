import { PermissionResponse } from 'expo-modules-core';
/**
 * Alias for `PermissionResponse` type exported by `unimodules-permission-interface`.
 */
export declare type CameraPermissionResponse = PermissionResponse;
/**
 * Extends [PermissionResponse](permissions.md#permissionresponse) type exported by
 * `unimodules-permission-interface` and contains additional iOS-specific field.
 */
export declare type MediaLibraryPermissionResponse = CameraPermissionResponse & {
    /**
     * @platform ios
     */
    accessPrivileges?: 'all' | 'limited' | 'none';
};
/**
 * An alias for the `MediaLibraryPermissionResponse` object.
 * @deprecated Use `ImagePicker.MediaLibraryPermissionResponse`
 */
export declare type CameraRollPermissionResponse = MediaLibraryPermissionResponse;
export declare enum MediaTypeOptions {
    /**
     * Images and videos.
     */
    All = "All",
    /**
     * Only videos.
     */
    Videos = "Videos",
    /**
     * Only images.
     */
    Images = "Images"
}
export declare enum VideoExportPreset {
    /**
     * Resolution: __Unchanged__ •
     * Video compression: __None__ •
     * Audio compression: __None__
     */
    Passthrough = 0,
    /**
     * Resolution: __Depends on the device__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    LowQuality = 1,
    /**
     * Resolution: __Depends on the device__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    MediumQuality = 2,
    /**
     * Resolution: __Depends on the device__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    HighestQuality = 3,
    /**
     * Resolution: __640 × 480__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    H264_640x480 = 4,
    /**
     * Resolution: __960 × 540__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    H264_960x540 = 5,
    /**
     * Resolution: __1280 × 720__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    H264_1280x720 = 6,
    /**
     * Resolution: __1920 × 1080__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    H264_1920x1080 = 7,
    /**
     * Resolution: __3840 × 2160__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    H264_3840x2160 = 8,
    /**
     * Resolution: __1920 × 1080__ •
     * Video compression: __HEVC__ •
     * Audio compression: __AAC__
     */
    HEVC_1920x1080 = 9,
    /**
     * Resolution: __3840 × 2160__ •
     * Video compression: __HEVC__ •
     * Audio compression: __AAC__
     */
    HEVC_3840x2160 = 10
}
export declare enum UIImagePickerControllerQualityType {
    /**
     * Highest available resolution.
     */
    High = 0,
    /**
     * Depends on the device.
     */
    Medium = 1,
    /**
     * Depends on the device.
     */
    Low = 2,
    /**
     * 640 × 480
     */
    VGA640x480 = 3,
    /**
     * 1280 × 720
     */
    IFrame1280x720 = 4,
    /**
     * 960 × 540
     */
    IFrame960x540 = 5
}
export declare enum UIImagePickerPresentationStyle {
    FullScreen = 0,
    PageSheet = 1,
    FormSheet = 2,
    CurrentContext = 3,
    OverFullScreen = 5,
    OverCurrentContext = 6,
    Popover = 7,
    BlurOverFullScreen = 8,
    Automatic = -2
}
export declare type ImageInfo = {
    /**
     * URI to the local image or video file (usable as the source of an `Image` element, in the case of
     * an image) and `width` and `height` specify the dimensions of the media.
     */
    uri: string;
    /**
     * Width of the image or video.
     */
    width: number;
    /**
     * Height of the image or video.
     */
    height: number;
    /**
     * The type of the asset.
     */
    type?: 'image' | 'video';
    /**
     * The `exif` field is included if the `exif` option is truthy, and is an object containing the
     * image's EXIF data. The names of this object's properties are EXIF tags and the values are the
     * respective EXIF values for those tags.
     */
    exif?: Record<string, any>;
    /**
     * Included if the `base64` option is truthy, and is a Base64-encoded string of the selected
     * image's JPEG data. If you prepend this with `'data:image/jpeg;base64,'` to create a data URI,
     * you can use it as the source of an `Image` element; for example:
     * ```ts
     * <Image
     *   source={{ uri: 'data:image/jpeg;base64,' + launchCameraResult.base64 }}
     *   style={{ width: 200, height: 200 }}
     * />
     * ```
     */
    base64?: string;
    /**
     * Length of the video in milliseconds.
     */
    duration?: number;
    /**
     * Boolean flag which shows if request was cancelled. If asset data have been returned this should
     * always be `false`.
     */
    cancelled: boolean;
};
export declare type ImagePickerErrorResult = {
    /**
     * The error code.
     */
    code: string;
    /**
     * The error message.
     */
    message: string;
    /**
     * The exception which caused the error.
     */
    exception?: string;
};
/**
 * An object returned when the pick action has been cancelled by the user.
 */
export declare type ImagePickerCancelledResult = {
    cancelled: true;
};
export declare type ImagePickerResult = ImagePickerCancelledResult | ImageInfo;
export declare type ImagePickerMultipleResult = ImagePickerCancelledResult | {
    cancelled: false;
    selected: ImageInfo[];
};
export declare type ImagePickerOptions = {
    /**
     * Whether to show a UI to edit the image after it is picked. On Android the user can crop and
     * rotate the image and on iOS simply crop it.
     * @default false
     */
    allowsEditing?: boolean;
    /**
     * An array with two entries `[x, y]` specifying the aspect ratio to maintain if the user is
     * allowed to edit the image (by passing `allowsEditing: true`). This is only applicable on
     * Android, since on iOS the crop rectangle is always a square.
     */
    aspect?: [number, number];
    /**
     * Specify the quality of compression, from `0` to `1`. `0` means compress for small size,
     * `1` means compress for maximum quality.
     * > Note: If the selected image has been compressed before, the size of the output file may be
     * > bigger than the size of the original image.
     */
    quality?: number;
    /**
     * Choose what type of media to pick.
     * @default ImagePicker.MediaTypeOptions.Images
     */
    mediaTypes?: MediaTypeOptions;
    /**
     * Whether to also include the EXIF data for the image. On iOS the EXIF data does not include GPS
     * tags in the camera case.
     */
    exif?: boolean;
    /**
     * Whether to also include the image data in Base64 format.
     */
    base64?: boolean;
    /**
     * Specify preset which will be used to compress selected video.
     * @default ImagePicker.VideoExportPreset.Passthrough
     * @platform ios 11+
     * @deprecated Deprecate: see [iOS videoExportPreset](https://developer.apple.com/documentation/uikit/uiimagepickercontroller/2890964-videoexportpreset?language=objc)
     */
    videoExportPreset?: VideoExportPreset;
    /**
     * Specify the quality of recorded videos. Defaults to `ImagePicker.UIImagePickerControllerQualityType.High`,
     * which is the highest available for the device.
     * @platform ios
     */
    videoQuality?: UIImagePickerControllerQualityType;
    /**
     * Whether or not to allow selecting multiple media files at once.
     * @platform web
     */
    allowsMultipleSelection?: boolean;
    /**
     * Maximum duration, in seconds, for video recording. Setting this to `0` disables the limit.
     * Defaults to `0` (no limit).
     * - **On iOS**, when `allowsEditing` is set to `true`, maximum duration is limited to 10 minutes.
     *   This limit is applied automatically, if `0` or no value is specified.
     * - **On Android**, effect of this option depends on support of installed camera app.
     * - **On Web** this option has no effect - the limit is browser-dependant.
     */
    videoMaxDuration?: number;
    /**
     * Choose [presentation style](https://developer.apple.com/documentation/uikit/uiviewcontroller/1621355-modalpresentationstyle?language=objc)
     * to customize view during taking photo/video.
     * @default ImagePicker.UIImagePickerPresentationStyle.Automatic
     * @platform ios
     */
    presentationStyle?: UIImagePickerPresentationStyle;
};
export declare type OpenFileBrowserOptions = {
    /**
     * Choose what type of media to pick.
     * @default ImagePicker.MediaTypeOptions.Images
     */
    mediaTypes: MediaTypeOptions;
    capture?: boolean;
    /**
     * Whether or not to allow selecting multiple media files at once.
     * @platform web
     */
    allowsMultipleSelection: boolean;
    /**
     * Whether to also include the image data in Base64 format.
     */
    base64: boolean;
};
export declare type ExpandImagePickerResult<T extends ImagePickerOptions | OpenFileBrowserOptions> = T extends {
    allowsMultipleSelection: true;
} ? ImagePickerMultipleResult : ImagePickerResult;
