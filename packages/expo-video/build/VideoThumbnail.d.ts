import { SharedRef } from 'expo';
/**
 * Represents a video thumbnail that references a native image.
 * Instances of this class can be passed as a source to the `Image` component from `expo-image`.
 * @platform ios
 */
export declare class VideoThumbnail extends SharedRef<'image'> {
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
declare const _default: typeof VideoThumbnail;
export default _default;
//# sourceMappingURL=VideoThumbnail.d.ts.map