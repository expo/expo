import ExpoVideoThumbnails from './ExpoVideoThumbnails';
import { NativeVideoThumbnail, } from './VideoThumbnailsTypes.types';
export { NativeVideoThumbnail };
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
/**
 * Create an image thumbnail and pass the result as a native image reference
 *
 * @param sourceFilename An URI of the video, local or remote.
 * @param options A map defining how modified thumbnail should be created.
 * @returns Returns a promise which fulfills with ['NativeVideoThumbnail'](#nativevideothumbnail)
 */
export async function getNativeThumbnailAsync(sourceFilename, options = {}) {
    return await ExpoVideoThumbnails.getNativeThumbnail(sourceFilename, options);
}
//# sourceMappingURL=VideoThumbnails.js.map