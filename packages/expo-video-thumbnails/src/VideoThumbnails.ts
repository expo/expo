import ExpoVideoThumbnails from './ExpoVideoThumbnails';
import { ThumbnailOptions, VideoThumbnailsResult } from './VideoThumbnailsTypes.types';

export { ThumbnailOptions, VideoThumbnailsResult };

export async function getThumbnailAsync(
  sourceFilename: string,
  options: ThumbnailOptions = {}
): Promise<VideoThumbnailsResult> {
  return await ExpoVideoThumbnails.getThumbnail(sourceFilename, options);
}
