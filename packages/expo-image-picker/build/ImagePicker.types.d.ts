import { PermissionResponse } from 'expo-modules-core';
/**
 * Alias for `PermissionResponse` type exported by `expo-modules-core`.
 */
export type CameraPermissionResponse = PermissionResponse;
/**
 * Extends `PermissionResponse` type exported by `expo-modules-core`, containing additional iOS-specific field.
 */
export type MediaLibraryPermissionResponse = PermissionResponse & {
    /**
     * @platform ios
     */
    accessPrivileges?: 'all' | 'limited' | 'none';
};
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
/**
 * Picker presentation style. Its values are directly mapped to the [`UIModalPresentationStyle`](https://developer.apple.com/documentation/uikit/uiviewcontroller/1621355-modalpresentationstyle).
 *
 * @platform ios
 */
export declare enum UIImagePickerPresentationStyle {
    /**
     * A presentation style in which the presented picker covers the screen.
     */
    FULL_SCREEN = "fullScreen",
    /**
     * A presentation style that partially covers the underlying content.
     */
    PAGE_SHEET = "pageSheet",
    /**
     * A presentation style that displays the picker centered in the screen.
     */
    FORM_SHEET = "formSheet",
    /**
     * A presentation style where the picker is displayed over the app's content.
     */
    CURRENT_CONTEXT = "currentContext",
    /**
     * A presentation style in which the picker view covers the screen.
     */
    OVER_FULL_SCREEN = "overFullScreen",
    /**
     * A presentation style where the picker is displayed over the app's content.
     */
    OVER_CURRENT_CONTEXT = "overCurrentContext",
    /**
     * A presentation style where the picker is displayed in a popover view.
     */
    POPOVER = "popover",
    /**
     * The default presentation style chosen by the system.
     * On older iOS versions, falls back to `WebBrowserPresentationStyle.FullScreen`.
     *
     * @platform ios 13+
     */
    AUTOMATIC = "automatic"
}
/**
 * Picker preferred asset representation mode. Its values are directly mapped to the [`PHPickerConfigurationAssetRepresentationMode`](https://developer.apple.com/documentation/photokit/phpickerconfigurationassetrepresentationmode).
 *
 * @platform ios
 */
export declare enum UIImagePickerPreferredAssetRepresentationMode {
    /**
     * A mode that indicates that the system chooses the appropriate asset representation.
     */
    Automatic = "automatic",
    /**
     * A mode that uses the most compatible asset representation.
     */
    Compatible = "compatible",
    /**
     * A mode that uses the current representation to avoid transcoding, if possible.
     */
    Current = "current"
}
export declare enum CameraType {
    /**
     * Back/rear camera.
     */
    back = "back",
    /**
     * Front camera
     */
    front = "front"
}
/**
 * @hidden
 * @deprecated Use `ImagePickerAsset` instead
 */
export type ImageInfo = ImagePickerAsset;
/**
 * Represents an asset (image or video) returned by the image picker or camera.
 */
export type ImagePickerAsset = {
    /**
     * URI to the local image or video file (usable as the source of an `Image` element, in the case of
     * an image) and `width` and `height` specify the dimensions of the media.
     */
    uri: string;
    /**
     * The unique ID that represents the picked image or video, if picked from the library. It can be used
     * by [expo-media-library](./media-library) to manage the picked asset.
     *
     * > This might be `null` when the ID is unavailable or the user gave limited permission to access the media library.
     * > On Android, the ID is unavailable when the user selects a photo by directly browsing file system.
     *
     * @platform ios
     * @platform android
     */
    assetId?: string | null;
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
     * Preferred filename to use when saving this item. This might be `null` when the name is unavailable
     * or user gave limited permission to access the media library.
     *
     * @platform ios
     */
    fileName?: string | null;
    /**
     * File size of the picked image or video, in bytes.
     *
     * @platform ios
     */
    fileSize?: number;
    /**
     * The `exif` field is included if the `exif` option is truthy, and is an object containing the
     * image's EXIF data. The names of this object's properties are EXIF tags and the values are the
     * respective EXIF values for those tags.
     */
    exif?: Record<string, any> | null;
    /**
     * When the `base64` option is truthy, it is a Base64-encoded string of the selected image's JPEG data, otherwise `null`.
     * If you prepend this with `'data:image/jpeg;base64,'` to create a data URI,
     * you can use it as the source of an `Image` element; for example:
     * ```ts
     * <Image
     *   source={{ uri: 'data:image/jpeg;base64,' + asset.base64 }}
     *   style={{ width: 200, height: 200 }}
     * />
     * ```
     */
    base64?: string | null;
    /**
     * Length of the video in milliseconds or `null` if the asset is not a video.
     */
    duration?: number | null;
};
export type ImagePickerErrorResult = {
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
 * Type representing successful and canceled pick result.
 */
export type ImagePickerResult = ImagePickerSuccessResult | ImagePickerCanceledResult;
/**
 * Type representing successful pick result.
 */
export type ImagePickerSuccessResult = {
    /**
     * Boolean flag set to `false` showing that the request was successful.
     */
    canceled: false;
    /**
     * An array of picked assets.
     */
    assets: ImagePickerAsset[];
};
/**
 * Type representing canceled pick result.
 */
export type ImagePickerCanceledResult = {
    /**
     * Boolean flag set to `true` showing that the request was canceled.
     */
    canceled: true;
    /**
     * `null` signifying that the request was canceled.
     */
    assets: null;
};
/**
 * @hidden
 * @deprecated Use `ImagePickerResult` instead.
 */
export type ImagePickerCancelledResult = ImagePickerCanceledResult;
/**
 * @hidden
 * @deprecated `ImagePickerMultipleResult` has been deprecated in favor of `ImagePickerResult`.
 */
export type ImagePickerMultipleResult = ImagePickerResult;
export type ImagePickerOptions = {
    /**
     * Whether to show a UI to edit the image after it is picked. On Android the user can crop and
     * rotate the image and on iOS simply crop it.
     *
     * > - Cropping multiple images is not supported - this option is mutually exclusive with `allowsMultipleSelection`.
     * > - On iOS, this option is ignored if `allowsMultipleSelection` is enabled.
     * > - On iOS cropping a `.bmp` image will convert it to `.png`.
     *
     * @default false
     * @platform ios
     * @platform android
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
     *
     * > Note: On iOS, if a `.bmp` or `.png` image is selected from the library, this option is ignored.
     *
     * @default 0.2
     * @platform ios
     * @platform android
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
     * @deprecated See [`videoExportPreset`](https://developer.apple.com/documentation/uikit/uiimagepickercontroller/2890964-videoexportpreset?language=objc)
     * in Apple documentation.
     */
    videoExportPreset?: VideoExportPreset;
    /**
     * Specify the quality of recorded videos. Defaults to the highest quality available for the device.
     * @default ImagePicker.UIImagePickerControllerQualityType.High
     * @platform ios
     */
    videoQuality?: UIImagePickerControllerQualityType;
    /**
     * Whether or not to allow selecting multiple media files at once.
     *
     * > Cropping multiple images is not supported - this option is mutually exclusive with `allowsEditing`.
     * > If this option is enabled, then `allowsEditing` is ignored.
     *
     * @default false
     * @platform ios 14+
     * @platform android
     * @platform web
     */
    allowsMultipleSelection?: boolean;
    /**
     * The maximum number of items that user can select. Applicable when `allowsMultipleSelection` is enabled.
     * Setting the value to `0` sets the selection limit to the maximum that the system supports.
     *
     * @platform ios 14+
     * @platform android
     * @default 0
     */
    selectionLimit?: number;
    /**
     * Whether to display number badges when assets are selected. The badges are numbered
     * in selection order. Assets are then returned in the exact same order they were selected.
     *
     * > Assets should be returned in the selection order regardless of this option,
     * > but there is no guarantee that it is always true when this option is disabled.
     *
     * @platform ios 15+
     * @default false
     */
    orderedSelection?: boolean;
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
    /**
     * Selects the camera-facing type. The `CameraType` enum provides two options:
     * `front` for the front-facing camera and `back` for the back-facing camera.
     * - **On Android**, the behavior of this option may vary based on the camera app installed on the device.
     * @default CameraType.back
     * @platform ios
     * @platform android
     */
    cameraType?: CameraType;
    /**
     * Choose [preferred asset representation mode](https://developer.apple.com/documentation/photokit/phpickerconfigurationassetrepresentationmode)
     * to use when loading assets.
     * @default ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Automatic
     * @platform ios 14+
     */
    preferredAssetRepresentationMode?: UIImagePickerPreferredAssetRepresentationMode;
};
export type OpenFileBrowserOptions = {
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
/**
 * @hidden
 * @deprecated Use `ImagePickerResult` or `OpenFileBrowserOptions` instead.
 */
export type ExpandImagePickerResult<T extends ImagePickerOptions | OpenFileBrowserOptions> = T extends {
    allowsMultipleSelection: true;
} ? ImagePickerResult : ImagePickerResult;
//# sourceMappingURL=ImagePicker.types.d.ts.map