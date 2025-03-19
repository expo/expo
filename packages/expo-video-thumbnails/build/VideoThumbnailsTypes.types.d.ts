import { SharedRef } from 'expo-modules-core';
export type VideoThumbnailsResult = {
    /**
     * URI to the created image (usable as the source for an Image/Video element).
     */
    uri: string;
    /**
     * Width of the created image.
     */
    width: number;
    /**
     * Height of the created image.
     */
    height: number;
};
export type VideoThumbnailsOptions = {
    /**
     * A value in range `0.0` - `1.0` specifying quality level of the result image. `1` means no
     * compression (highest quality) and `0` the highest compression (lowest quality).
     */
    quality?: number;
    /**
     * The time position where the image will be retrieved in ms.
     */
    time?: number;
    /**
     * In case `sourceFilename` is a remote URI, `headers` object is passed in a network request.
     */
    headers?: Record<string, string>;
};
/**
 * Represents a video thumbnail that references a native image.
 * Instances of this class can be passed as a source to the `Image` component from `expo-image`.
 * @platform android
 * @platform ios
 */
export declare class NativeVideoThumbnail extends SharedRef<'image'> {
    /**
     * Width of the created thumbnail.
     */
    width: number;
    /**
     * Height of the created thumbnail.
     */
    height: number;
    /**
     * The time in seconds at which the thumbnail was to be created.
     */
    requestedTime: number;
    /**
     * The time in seconds at which the thumbnail was actually generated.
     * @platform ios
     */
    actualTime: number;
}
//# sourceMappingURL=VideoThumbnailsTypes.types.d.ts.map