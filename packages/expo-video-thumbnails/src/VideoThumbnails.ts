import ExpoVideoThumbnails from './ExpoVideoThumbnails';
import type { VideoThumbnailsOptions, VideoThumbnailsResult } from './VideoThumbnailsTypes.types';

export type { VideoThumbnailsOptions, VideoThumbnailsResult } from './VideoThumbnailsTypes.types';

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
