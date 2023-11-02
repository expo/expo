import { ViewProps } from 'react-native';
/**
 * A class that represents an instance of the video player.
 */
export declare class VideoPlayer {
    /**
     * Boolean value whether the player is currently playing.
     */
    isPlaying: boolean;
    /**
     * Boolean value whether the player is currently muted.
     */
    isMuted: boolean;
    /**
     * Resumes the player.
     */
    play(): void;
    /**
     * Pauses the player.
     */
    pause(): void;
    /**
     * Replaces the current source with a new one.
     */
    replace(source: string): void;
    /**
     * Seeks the playback by the given number of seconds.
     */
    seekBy(seconds: number): void;
    /**
     * Seeks the playback to the beginning.
     */
    replay(): void;
}
/**
 * Describes how a video should be scaled to fit in a container.
 * 'contain': The video maintains its aspect ratio and fits inside the container, with possible letterboxing/pillarboxing.
 * 'cover': The video maintains its aspect ratio and covers the entire container, potentially cropping some portions.
 * 'fill': The video stretches/squeezes to completely fill the container, potentially causing distortion.
 */
type VideoContentFit = 'contain' | 'cover' | 'fill';
export interface VideoViewProps extends ViewProps {
    /**
     * @platform ios, web
     * A player instance – use `useVideoPlayer()` to create one.
     */
    player: VideoPlayer;
    /**
     * @platform ios, web
     * Determines whether native controls should be displayed or not.
     */
    nativeControls: boolean | undefined;
    /**
     * @platform ios, web
     * Describes how the video should be scaled to fit in the container.
     * Options are 'contain', 'cover', and 'fill'.
     */
    contentFit: VideoContentFit | undefined;
    /**
     * @platform ios, web
     * Determines whether fullscreen mode is allowed or not.
     */
    allowsFullscreen: boolean | undefined;
    /**
     * @platform ios
     * Determines whether the timecodes should be displayed or not.
     */
    showsTimecodes: boolean | undefined;
    /**
     * @platform ios
     * Determines whether the player allows the user to skip media content.
     */
    requiresLinearPlayback: boolean | undefined;
    /**
     * @platform ios
     * Determines the position offset of the video inside the container.
     */
    contentPosition: {
        dx?: number;
        dy?: number;
    } | undefined;
}
export {};
//# sourceMappingURL=VideoView.types.d.ts.map