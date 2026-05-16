/**
 * Creates a `VideoPlaylist` that is automatically released when the component unmounts.
 *
 * @platform ios
 */
export function useVideoPlaylist(_options = {}) {
    throwUnsupportedVideoPlaylistError();
}
/**
 * Returns status updates for a [`VideoPlaylist`](#videoplaylist).
 *
 * @platform ios
 */
export function useVideoPlaylistStatus(_playlist) {
    throwUnsupportedVideoPlaylistError();
}
/**
 * Creates a direct `VideoPlaylist` instance that does not release automatically.
 *
 * @platform ios
 */
export function createVideoPlaylist(_options = {}) {
    throwUnsupportedVideoPlaylistError();
}
function throwUnsupportedVideoPlaylistError() {
    throw new Error('expo-video: VideoPlaylist is not available on web. This first implementation only includes iOS native support. Guard VideoPlaylist usage with Platform.OS === "ios", or use VideoPlayer directly until web playlist support is added.');
}
//# sourceMappingURL=VideoPlaylist.web.js.map