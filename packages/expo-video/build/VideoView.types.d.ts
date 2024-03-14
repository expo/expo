import { ViewProps } from 'react-native';
/**
 * A class that represents an instance of the video player.
 */
export declare class VideoPlayer {
    /**
     * Boolean value whether the player is currently playing.
     * > This property is get-only, use `play` and `pause` methods to control the playback.
     */
    playing: boolean;
    /**
     * Determines whether the player should automatically replay after reaching the end of the video.
     * @default false
     */
    loop: boolean;
    /**
     * Boolean value whether the player is currently muted.
     * @default false
     */
    muted: boolean;
    /**
     * Integer value representing the current position in seconds.
     */
    currentTime: number;
    /**
     * Float value between 0 and 1 representing the current volume.
     * Muting the player doesn't affect the volume. In other words, when the player is muted, the volume is the same as
     * when unmuted. Similarly, setting the volume doesn't unmute the player.
     * @default 1.0
     */
    volume: number;
    /**
     * Boolean value indicating if the player should correct audio pitch when the playback speed changes.
     * > On web, changing this property is not supported, the player will always correct the pitch.
     * @default true
     * @platform android
     * @platform ios
     */
    preservesPitch: boolean;
    /**
     * Float value between 0 and 16 indicating the current playback speed of the player.
     * @default 1.0
     */
    playbackRate: number;
    /**
     * Determines whether the player should continue playing after the app enters the background.
     * @default false
     * @platform ios
     * @platform android
     */
    staysActiveInBackground: boolean;
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
    replace(source: VideoSource): void;
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
     * A player instance – use `useVideoPlayer()` to create one.
     */
    player: VideoPlayer;
    /**
     * Determines whether native controls should be displayed or not.
     * @default true
     */
    nativeControls?: boolean;
    /**
     * Describes how the video should be scaled to fit in the container.
     * Options are 'contain', 'cover', and 'fill'.
     * @default 'contain'
     */
    contentFit?: VideoContentFit;
    /**
     * Determines whether fullscreen mode is allowed or not.
     * @default true
     */
    allowsFullscreen?: boolean;
    /**
     * Determines whether the timecodes should be displayed or not.
     * @default true
     * @platform ios
     */
    showsTimecodes?: boolean;
    /**
     * Determines whether the player allows the user to skip media content.
     * @default false
     * @platform android
     * @platform ios
     */
    requiresLinearPlayback?: boolean;
    /**
     * Determines the position offset of the video inside the container.
     * @default { dx: 0, dy: 0 }
     * @platform ios
     */
    contentPosition?: {
        dx?: number;
        dy?: number;
    };
    /**
     * A callback to call after the video player enters Picture in Picture (PiP) mode.
     * @platform android
     * @platform ios 14+
     */
    onPictureInPictureStart?: () => void;
    /**
     * A callback to call after the video player exits Picture in Picture (PiP) mode.
     * @platform android
     * @platform ios 14+
     */
    onPictureInPictureStop?: () => void;
    /**
     * Determines whether the player allows Picture in Picture (PiP) mode.
     * @default false
     * @platform ios 14+
     */
    allowsPictureInPicture?: boolean;
    /**
     * Determines whether the player should start Picture in Picture (PiP) automatically when the app is in the background.
     * > **Note:** Only one player can be in Picture in Picture (PiP) mode at a time.
     * @default false
     * @platform android 12+
     * @platform ios 14.2+
     */
    startsPictureInPictureAutomatically?: boolean;
}
export type TransparentVideoViewProps = Omit<VideoViewProps, 'onPictureInPictureStart' | 'onPictureInPictureStop' | 'allowsPictureInPicture' | 'startsPictureInPictureAutomatically' | 'allowsFullscreen' | 'nativeControls' | 'contentFit'>;
/**
 * Specifies which type of DRM to use. Android supports Widevine, PlayReady and ClearKey, iOS supports FairPlay.
 * */
type DRMType = 'clearkey' | 'fairplay' | 'playready' | 'widevine';
/**
 * Specifies DRM options which will be used by the player while loading the video.
 */
type DRMOptions = {
    /**
     * Determines which type of DRM to use.
     */
    type: DRMType;
    /**
     * Determines the license server URL.
     */
    licenseServer: string;
    /**
     * Determines headers sent to the license server on license requests.
     */
    headers?: {
        [key: string]: string;
    };
    /**
     * Specifies whether the DRM is a multi-key DRM.
     * @platform android
     */
    multiKey?: boolean;
    /**
     * Specifies the content ID of the stream.
     * @platform ios
     */
    contentId?: string;
    /**
     * Specifies the certificate URL for the FairPlay DRM.
     * @platform ios
     */
    certificateUrl?: string;
};
export type VideoSource = string | {
    uri: string;
    drm?: DRMOptions;
} | null;
export {};
//# sourceMappingURL=VideoView.types.d.ts.map