import ExpoVideoThumbnails from './ExpoVideoThumbnails';
import { VideoThumbnailsOptions, VideoThumbnailsResult } from './VideoThumbnailsTypes.types';

export { VideoThumbnailsOptions, VideoThumbnailsResult };

export async function getThumbnailAsync(
  sourceFilename: string,
  options: VideoThumbnailsOptions = {}
): Promise<VideoThumbnailsResult> {
  return await ExpoVideoThumbnails.getThumbnail(sourceFilename, options);
}
