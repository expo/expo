import { useReleasingSharedObject } from 'expo-modules-core';
import NativeVideoModule from './NativeVideoModule';
/**
 * Creates a `VideoPlayer`, which will be automatically cleaned up when the component is unmounted.
 * @param source - A video source that is used to initialize the player.
 * @param setup - A function that allows setting up the player. It will run after the player is created.
 */
export function useVideoPlayer(source, setup) {
    const parsedSource = typeof source === 'string' ? { uri: source } : source;
    return useReleasingSharedObject(() => {
        const player = new NativeVideoModule.VideoPlayer(parsedSource);
        setup?.(player);
        return player;
    }, [JSON.stringify(parsedSource)]);
}
export default NativeVideoModule.VideoPlayer;
//# sourceMappingURL=VideoPlayer.js.map