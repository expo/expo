import ExpoVideoThumbnails from './ExpoVideoThumbnails';
// @needsAudit
/**
 * Create an image thumbnail from video provided via `sourceFilename`.
 *
 * @param sourceFilename An URI of the video, local or remote.
 * @param options A map defining how modified thumbnail should be created.
 *
 * @return Returns a promise which fulfils with [`VideoThumbnailsResult`](#videothumbnailsresult).
 */
export async function getThumbnailAsync(sourceFilename, options = {}) {
    return await ExpoVideoThumbnails.getThumbnail(sourceFilename, options);
}
//# sourceMappingURL=VideoThumbnails.js.map