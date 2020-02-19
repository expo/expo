import { ThumbnailOptions, VideoThumbnailsResult } from './VideoThumbnailsTypes.types';
export { ThumbnailOptions, VideoThumbnailsResult };
export declare function getThumbnailAsync(sourceFilename: string, options?: ThumbnailOptions): Promise<VideoThumbnailsResult>;
