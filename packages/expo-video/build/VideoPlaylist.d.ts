import type { VideoPlaylist, VideoPlaylistOptions, VideoPlaylistStatus } from './VideoPlaylist.types';
/**
 * Creates a `VideoPlaylist` that is automatically released when the component unmounts.
 *
 * The `sources` option is used only as the initial playlist contents. Updating the `sources` array
 * after the hook runs does not control the playlist. Use the returned playlist's mutation methods
 * to change its contents.
 *
 * @param options Playlist creation options.
 * @returns A `VideoPlaylist` instance managed by the component lifecycle.
 *
 * @example
 * ```tsx
 * import { useVideoPlaylist, useVideoPlaylistStatus, VideoView } from 'expo-video';
 *
 * export default function PlaylistScreen() {
 *   const playlist = useVideoPlaylist({
 *     sources: [
 *       { id: 'intro', source: require('./intro.mp4') },
 *       { id: 'feature', source: 'https://example.com/video.mp4' },
 *     ],
 *     loop: 'all',
 *     preloadNext: true,
 *   });
 *   const status = useVideoPlaylistStatus(playlist);
 *
 *   return <VideoView player={playlist.player} />;
 * }
 * ```
 *
 * @platform ios
 */
export declare function useVideoPlaylist(options?: VideoPlaylistOptions): VideoPlaylist;
/**
 * Returns status updates for a [`VideoPlaylist`](#videoplaylist).
 *
 * The returned value updates when playback starts or pauses, the current time changes, a source loads,
 * the current source changes, or playback reaches the end of a source.
 *
 * @param playlist Playlist to observe.
 * @returns Current playlist status.
 * @platform ios
 */
export declare function useVideoPlaylistStatus(playlist: VideoPlaylist): VideoPlaylistStatus;
/**
 * Creates a direct `VideoPlaylist` instance that does not release automatically.
 *
 * > **info** In most components, use [`useVideoPlaylist`](#usevideoplaylistoptions) so the playlist
 * > releases when the component unmounts. When creating a playlist directly, call [`release()`](../sdk/expo/#release)
 * > or [`destroy`](#destroy) when it is no longer needed.
 *
 * @param options Playlist creation options.
 * @returns A `VideoPlaylist` instance.
 * @platform ios
 */
export declare function createVideoPlaylist(options?: VideoPlaylistOptions): VideoPlaylist;
//# sourceMappingURL=VideoPlaylist.d.ts.map