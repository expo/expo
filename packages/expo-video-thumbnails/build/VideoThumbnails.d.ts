import { NativeVideoThumbnail, VideoThumbnailsOptions, VideoThumbnailsResult } from './VideoThumbnailsTypes.types';
export { VideoThumbnailsOptions, VideoThumbnailsResult, NativeVideoThumbnail };
/**
 * Create an image thumbnail from video provided via `sourceFilename`.
 *
 * @param sourceFilename An URI of the video, local or remote.
 * @param options A map defining how modified thumbnail should be created.
 *
 * @return Returns a promise which fulfils with [`VideoThumbnailsResult`](#videothumbnailsresult).
 */
export declare function getThumbnailAsync(sourceFilename: string, options?: VideoThumbnailsOptions): Promise<VideoThumbnailsResult>;
/**
 * Create an image thumbnail and pass the result as a native image reference.
 *
 * @param sourceFilename An URI of the video, local or remote.
 * @param options A map defining how modified thumbnail should be created.
 * @returns Returns a promise which fulfills with ['NativeVideoThumbnail'](#nativevideothumbnail).
 */
export declare function getNativeThumbnailAsync(sourceFilename: string, options?: VideoThumbnailsOptions): Promise<NativeVideoThumbnail | null>;
//# sourceMappingURL=VideoThumbnails.d.ts.map