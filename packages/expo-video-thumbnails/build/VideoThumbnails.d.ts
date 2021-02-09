import { VideoThumbnailsOptions, VideoThumbnailsResult } from './VideoThumbnailsTypes.types';
export { VideoThumbnailsOptions, VideoThumbnailsResult };
export declare function getThumbnailAsync(sourceFilename: string, options?: VideoThumbnailsOptions): Promise<VideoThumbnailsResult>;
