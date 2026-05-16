import { useEvent } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';
import { useMemo } from 'react';
import { Platform } from 'react-native';
import NativeVideoModule from './NativeVideoModule';
import resolveAssetSource from './resolveAssetSource';
const PLAYLIST_STATUS_UPDATE = 'playlistStatusUpdate';
const VideoPlaylistClass = NativeVideoModule.VideoPlaylist;
if (VideoPlaylistClass) {
    const add = VideoPlaylistClass.prototype.add;
    VideoPlaylistClass.prototype.add = function (source) {
        return add.call(this, normalizePlaylistSource(source));
    };
    const insert = VideoPlaylistClass.prototype.insert;
    VideoPlaylistClass.prototype.insert = function (source, index) {
        return insert.call(this, normalizePlaylistSource(source), index);
    };
    const replaceAll = VideoPlaylistClass.prototype.replaceAll;
    VideoPlaylistClass.prototype.replaceAll = function (sources, options) {
        return replaceAll.call(this, normalizePlaylistSources(sources), options);
    };
}
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
export function useVideoPlaylist(options = {}) {
    assertVideoPlaylistIsSupported();
    const { sources = [], initialIndex = 0, loop = 'none', preloadNext = false, autoAdvance = true, updateInterval = 500, } = options;
    const normalizedSources = normalizePlaylistSources(sources);
    return useReleasingSharedObject(() => new NativeVideoModule.VideoPlaylist(normalizedSources, initialIndex, updateInterval, loop, preloadNext, autoAdvance), []);
}
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
export function useVideoPlaylistStatus(playlist) {
    assertVideoPlaylistIsSupported();
    const currentStatus = useMemo(() => playlist.currentStatus, [playlist.id]);
    return useEvent(playlist, PLAYLIST_STATUS_UPDATE, currentStatus);
}
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
export function createVideoPlaylist(options = {}) {
    assertVideoPlaylistIsSupported();
    const { sources = [], initialIndex = 0, loop = 'none', preloadNext = false, autoAdvance = true, updateInterval = 500, } = options;
    return new NativeVideoModule.VideoPlaylist(normalizePlaylistSources(sources), initialIndex, updateInterval, loop, preloadNext, autoAdvance);
}
function assertVideoPlaylistIsSupported() {
    if (Platform.OS === 'ios' && NativeVideoModule.VideoPlaylist) {
        return;
    }
    throw new Error(`expo-video: VideoPlaylist is not available on ${Platform.OS}. This first implementation only includes iOS native support. Guard VideoPlaylist usage with Platform.OS === 'ios', or use VideoPlayer directly until Android and web playlist support is added.`);
}
function normalizePlaylistSources(sources) {
    return sources.map(normalizePlaylistSource);
}
function normalizePlaylistSource(source) {
    if (isStructuredPlaylistSource(source)) {
        const parsedSource = applyMetadata(parseSource(source.source), source.metadata);
        const normalizedSource = {
            source: parsedSource,
        };
        if (source.id != null) {
            normalizedSource.id = source.id;
        }
        if (source.metadata != null) {
            normalizedSource.metadata = source.metadata;
        }
        return normalizedSource;
    }
    const parsedSource = parseSource(source);
    const metadata = getSourceMetadata(parsedSource);
    return metadata ? { source: parsedSource, metadata } : { source: parsedSource };
}
function isStructuredPlaylistSource(source) {
    return source != null && typeof source === 'object' && 'source' in source;
}
function parseSource(source) {
    if (typeof source === 'number') {
        return { uri: resolveAssetSource(source)?.uri };
    }
    if (typeof source === 'string') {
        return { uri: source };
    }
    if (typeof source?.assetId === 'number' && !source.uri) {
        return { ...source, uri: resolveAssetSource(source.assetId)?.uri };
    }
    return source;
}
function applyMetadata(source, metadata) {
    if (!metadata || !source || typeof source !== 'object') {
        return source;
    }
    return { ...source, metadata };
}
function getSourceMetadata(source) {
    if (!source || typeof source !== 'object') {
        return undefined;
    }
    return source.metadata;
}
//# sourceMappingURL=VideoPlaylist.js.map