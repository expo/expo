import ExpoVideoThumbnails from './ExpoVideoThumbnails';
import { VideoThumbnailsOptions, VideoThumbnailsResult } from './VideoThumbnailsTypes.types';

export { VideoThumbnailsOptions, VideoThumbnailsResult };

// @needsAudit
/**
 * Create an image thumbnail from video provided via `sourceFilename`.
 *
 * @param sourceFilename An URI of the video, local or remote.
 * @param options A map defining how modified thumbnail should be created.
 *
 * @return Returns a promise which fulfils with [`VideoThumbnailsResult`](#videothumbnailsresult).
 */
export async function getThumbnailAsync(
  sourceFilename: string,
  options: VideoThumbnailsOptions = {}
): Promise<VideoThumbnailsResult> {
  return await ExpoVideoThumbnails.getThumbnail(sourceFilename, options);
}
