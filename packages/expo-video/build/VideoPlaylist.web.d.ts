import type { VideoPlaylist, VideoPlaylistOptions, VideoPlaylistStatus } from './VideoPlaylist.types';
/**
 * Creates a `VideoPlaylist` that is automatically released when the component unmounts.
 *
 * @platform ios
 */
export declare function useVideoPlaylist(_options?: VideoPlaylistOptions): VideoPlaylist;
/**
 * Returns status updates for a [`VideoPlaylist`](#videoplaylist).
 *
 * @platform ios
 */
export declare function useVideoPlaylistStatus(_playlist: VideoPlaylist): VideoPlaylistStatus;
/**
 * Creates a direct `VideoPlaylist` instance that does not release automatically.
 *
 * @platform ios
 */
export declare function createVideoPlaylist(_options?: VideoPlaylistOptions): VideoPlaylist;
//# sourceMappingURL=VideoPlaylist.web.d.ts.map