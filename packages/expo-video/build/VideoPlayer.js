import { useReleasingSharedObject } from 'expo-modules-core';
import NativeVideoModule from './NativeVideoModule';
import resolveAssetSource from './resolveAssetSource';
// TODO: Temporary solution until we develop a way of overriding prototypes that won't break the lazy loading of the module.
const replace = NativeVideoModule.VideoPlayer.prototype.replace;
NativeVideoModule.VideoPlayer.prototype.replace = function (source) {
    return replace.call(this, parseSource(source));
};
/**
 * Creates a `VideoPlayer`, which will be automatically cleaned up when the component is unmounted.
 * @param source - A video source that is used to initialize the player.
 * @param setup - A function that allows setting up the player. It will run after the player is created.
 */
export function useVideoPlayer(source, setup) {
    const parsedSource = parseSource(source);
    return useReleasingSharedObject(() => {
        const player = new NativeVideoModule.VideoPlayer(parsedSource);
        setup?.(player);
        return player;
    }, [JSON.stringify(parsedSource)]);
}
function parseSource(source) {
    if (typeof source === 'number') {
        return { uri: resolveAssetSource(source).uri };
    }
    else if (typeof source === 'string') {
        return { uri: source };
    }
    if (typeof source?.assetId === 'number' && !source.uri) {
        return { ...source, uri: resolveAssetSource(source.assetId).uri };
    }
    return source;
}
export default NativeVideoModule.VideoPlayer;
//# sourceMappingURL=VideoPlayer.js.map