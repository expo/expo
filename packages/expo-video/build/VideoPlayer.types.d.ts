import type { SharedObject } from 'expo-modules-core';
/**
 * A class that represents an instance of the video player.
 */
export declare class VideoPlayer extends SharedObject<VideoPlayerEvents> {
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
     * Setting this property to `true`/`false` will mute/unmute the player.
     * @default false
     */
    muted: boolean;
    /**
     * Float value indicating the current playback time in seconds.
     *
     * If the player is not yet playing, this value indicates the time position
     * at which playback will begin once the `play()` method is called.
     *
     * Setting `currentTime` to a new value seeks the player to the given time.
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
     * Indicates the current status of the player.
     * > This property is get-only
     */
    status: VideoPlayerStatus;
    /**
     * Boolean value determining whether the player should show the now playing notification.
     */
    showNowPlayingNotification: boolean;
    /**
     * Determines whether the player should continue playing after the app enters the background.
     * @default false
     * @platform ios
     * @platform android
     */
    staysActiveInBackground: boolean;
    /**
     * Initializes a new video player instance with the given source.
     * @hidden
     */
    constructor(source: VideoSource);
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
 * Handlers for events which can be emitted by the player.
 */
export type VideoPlayerEvents = {
    /**
     * Handler for an event emitted when the status of the player changes.
     */
    statusChange(newStatus: VideoPlayerStatus, oldStatus: VideoPlayerStatus, error: PlayerError): void;
    /**
     * Handler for an event emitted when the player starts or stops playback.
     */
    playingChange(newIsPlaying: boolean, oldIsPlaying: boolean): void;
    /**
     * Handler for an event emitted when the `playbackRate` property of the player changes.
     */
    playbackRateChange(newPlaybackRate: number, oldPlaybackRate: number): void;
    /**
     * Handler for an event emitted when the `volume` property of the player changes.
     */
    volumeChange(newVolume: VolumeEvent, oldVolume: VolumeEvent): void;
    /**
     * Handler for an event emitted when the player plays to the end of the current source.
     */
    playToEnd(): void;
    /**
     * Handler for an event emitted when the current media source of the player changes.
     */
    sourceChange(newSource: VideoSource, previousSource: VideoSource): void;
};
/**
 * Describes the current status of the player.
 * - `idle`: The player is not playing or loading any videos.
 * - `loading`: The player is loading video data from the provided source
 * - `readyToPlay`: The player has loaded enough data to start playing or to continue playback.
 * - `error`: The player has encountered an error while loading or playing the video.
 */
export type VideoPlayerStatus = 'idle' | 'loading' | 'readyToPlay' | 'error';
export type VideoSource = string | {
    /**
     * The URI of the video.
     */
    uri: string;
    /**
     * Specifies the DRM options which will be used by the player while loading the video.
     */
    drm?: DRMOptions;
    /**
     * Specifies information which will be displayed in the now playing notification.
     * When undefined the player will display information contained in the video metadata.
     */
    metadata?: VideoMetadata;
} | null;
/**
 * Contains information about any errors that the player encountered during the playback
 */
export type PlayerError = {
    message: string;
};
/**
 * Contains information about the current volume and whether the player is muted.
 */
export type VolumeEvent = {
    volume: number;
    isMuted: boolean;
};
/**
 * Contains information that will be displayed in the now playing notification when the video is playing.
 */
export type VideoMetadata = {
    /**
     * The title of the video.
     */
    title?: string;
    /**
     * Secondary text that will be displayed under the title.
     */
    artist?: string;
};
/**
 * Specifies which type of DRM to use. Android supports Widevine, PlayReady and ClearKey, iOS supports FairPlay.
 */
export type DRMType = 'clearkey' | 'fairplay' | 'playready' | 'widevine';
/**
 * Specifies DRM options which will be used by the player while loading the video.
 */
export type DRMOptions = {
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
//# sourceMappingURL=VideoPlayer.types.d.ts.map