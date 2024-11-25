import { VideoSource, VideoPlayer } from './VideoPlayer.types';
/**
 * Creates a direct instance of `VideoPlayer` that doesn't release automatically.
 *
 * > **info** For most use cases you should use the [`useVideoPlayer`](#usevideoplayer) hook instead. See the [Using the VideoPlayer Directly](#using-the-videoplayer-directly) section for more details.
 * @param source
 */
export declare function createVideoPlayer(source: VideoSource): VideoPlayer;
/**
 * Creates a `VideoPlayer`, which will be automatically cleaned up when the component is unmounted.
 * @param source - A video source that is used to initialize the player.
 * @param setup - A function that allows setting up the player. It will run after the player is created.
 */
export declare function useVideoPlayer(source: VideoSource, setup?: (player: VideoPlayer) => void): VideoPlayer;
//# sourceMappingURL=VideoPlayer.d.ts.map