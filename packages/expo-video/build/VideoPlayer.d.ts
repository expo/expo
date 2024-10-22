import NativeVideoModule from './NativeVideoModule';
import { VideoSource } from './VideoPlayer.types';
export default class VideoPlayer extends NativeVideoModule.VideoPlayer {
    constructor(source: VideoSource);
}
/**
 * Creates a `VideoPlayer`, which will be automatically cleaned up when the component is unmounted.
 * @param source - A video source that is used to initialize the player.
 * @param setup - A function that allows setting up the player. It will run after the player is created.
 */
export declare function useVideoPlayer(source: VideoSource, setup?: (player: VideoPlayer) => void): VideoPlayer;
//# sourceMappingURL=VideoPlayer.d.ts.map