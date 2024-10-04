import type { VideoPlayer, VideoSource } from './VideoPlayer.types';
/**
 * Creates a `VideoPlayer`, which will be automatically cleaned up when the component is unmounted.
 * @param source - A video source that is used to initialize the player.
 * @param setup - A function that allows setting up the player. It will run after the player is created.
 */
export declare function useVideoPlayer(source: VideoSource, setup?: (player: VideoPlayer) => void): VideoPlayer;
declare const _default: typeof VideoPlayer;
export default _default;
//# sourceMappingURL=VideoPlayer.d.ts.map