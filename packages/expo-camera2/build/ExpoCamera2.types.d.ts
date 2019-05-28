/**
 * Options for video recording using camera.
 */
export interface VideoRecordingOptions {
    /**
     * If the chosen quality is not available for a device, the highest available is chosen.
     */
    quality?: VideoQuality;
    /**
     * Maximum duration in seconds.
     * No value means no limit.
     */
    maxDuration?: number;
    /**
     * Maximum video file size in bytes.
     * No value means no limit.
     */
    maxFileSize?: number;
    /**
     * If enabled, video will be recorded with no sound.
     * @default false
     */
    mute?: boolean;
}
/**
 * Recorded video.
 */
export interface Video {
    /**
     * File uri with recorded video.
     */
    uri: string;
}
/**
 * Options for taking picture with camera.
 */
export interface TakingPictureOptions {
    /**
     * Quality of compression.
     * Value between `0.0` and `1.0`.
     * `0.0` - maximum compression (minimum quality and size).
     * `1.0` - no compression (maximum quality).
     * @default 1.0
     */
    quality?: number;
    /**
     * Flag idicating whether to also include the image data in Base64 format.
     * @default false
     */
    base64?: boolean;
    /**
     * Flag idicating whether to also include the EXIF data for the image.
     * @default false
     */
    exif?: boolean;
    /**
     * If set to `true` camera component skips orientation adjustment and returns an image straight from the device's camera.
     * Moreover `quality` option is discarded (processing pipeline is skipped as a whole).
     * Although enabling this option reduces image delivery time significantly,
     * it may cause the image to appear in a wrong orientation in the Image component
     * (at the time of writing, it does not respect EXIF orientation of the images).
     *
     * > Enabling **skipProcessing** would cause orientation uncertainty.
     * > Image component does not respect EXIF stored orientation information, that means obtained image would be displayed wrongly (rotated by 90°, 180° or 270°).
     * > Different devices provide different orientations.
     * > For example some Sony Xperia or Samsung devices don't provide correctly oriented images by default.
     * > To always obtain correctly oriented image disable **skipProcessing** option.
     *
     * @default false
     * @Android only
     */
    skipProcessing?: boolean;
}
/**
 * Taken picture.
 */
export interface Picture {
    /**
     * Width of the picture.
     */
    width: number;
    /**
     * Height of the picture.
     */
    height: number;
    /**
     * URI to the local image file (useable as the source for an **Image** element).
     *
     * > The local image URI is temporary.
     * > Use **Expo.FileSystem.copyAsync** to make a permanent copy of the image.
     */
    uri: string;
    /**
     * String containing the JPEG data of the image in Base64.
     * Available when **base64** option was enabled in **takePictureAsync** method.
     *
     * > Prepend that with `data:image/jpg;base64,` to get a data URI,
     * > which you can use as the source for an **Image** element for example.
     */
    base64?: string;
    /**
     * Object containing EXIF data for the image.
     * The **keys** of its properties are EXIF tags and their **values** are the values for those tags.
     * Available when **exif** option was enabled in **takePictureAsync** method.
     */
    exif?: {
        [key: string]: any;
    };
}
/**
 *
 */
export interface FocusPoint {
    x: number;
    y: number;
}
export interface MountError {
    nativeEvent: {
        message: string;
    };
}
/**
 * Quality of recorded video.
 */
export declare enum VideoQuality {
    /**
     * `2160p`
     */
    VQ_2160p = "2160p",
    /**
     * `1080p`
     */
    VQ_1080p = "1080p",
    /**
     * `720p`
     */
    VQ_720p = "720p",
    /**
     * `480p`
     */
    VQ_480p = "480p",
    /**
     * `4:3` resulting in video of size `640x480`.
     * @Android only
     */
    VQ_4x3 = "4x3"
}
/**
 * Camera facing mapped into camera sensor being used.
 */
export declare enum Facing {
    /**
     * Front-facing camera sensor.
     */
    Front = "front",
    /**
     * Back-facing camera sensor.
     */
    Back = "back"
}
/**
 * Camera flash mode.
 */
export declare enum FlashMode {
    /**
     * Device would flash during taking picture.
     */
    On = "on",
    /**
     * No flash.
     */
    Off = "off",
    /**
     * Flash would be fired automatically if required.
     */
    Auto = "auto",
    /**
     * Constantly turned on flash.
     */
    Torch = "torch"
}
/**
 * State of camera autofocus.
 */
export declare enum Autofocus {
    /**
     * Autofocus enabled.
     */
    On = "on",
    /**
     * Autofocus disabled.
     * Focus would lock as it was in the moment of change,
     * but it can be adjusted on some devices via `focusDepth` prop.
     */
    Off = "off"
}
/**
 * Camera white balance.
 * If a device does not support any of these values previous one is used.
 */
export declare enum WhiteBalance {
    /**
     *
     */
    Auto = "auto",
    /**
     *
     */
    Sunny = "sunny",
    /**
     *
     */
    Cloudy = "cloudy",
    /**
     *
     */
    Shadow = "shadow",
    /**
     *
     */
    Flurescent = "flurescent",
    /**
     *
     */
    Incandescnet = "incandescnet"
}
export declare enum HDR {
    /**
     *
     */
    On = "on",
    /**
     *
     */
    Off = "off"
}
