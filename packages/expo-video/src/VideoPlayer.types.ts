import type { SharedObject } from 'expo-modules-core';

/**
 * A class that represents an instance of the video player.
 */
export declare class VideoPlayer extends SharedObject<VideoPlayerEvents> {
  /**
   * Boolean value whether the player is currently playing.
   * > Use `play` and `pause` methods to control the playback.
   */
  readonly playing: boolean;

  /**
   * Determines whether the player should automatically replay after reaching the end of the video.
   * @default false
   */
  loop: boolean;

  /**
   * Determines whether the player should allow external playback.
   * @default true
   * @platform ios
   */
  allowsExternalPlayback: boolean;

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
   * The exact timestamp when the currently displayed video frame was sent from the server,
   * based on the `EXT-X-PROGRAM-DATE-TIME` tag in the livestream metadata.
   * If this metadata is missing, this property will return `null`.
   * @platform android
   * @platform ios
   */
  readonly currentLiveTimestamp: number | null;

  /**
   * Float value indicating the latency of the live stream in seconds.
   * If a livestream doesn't have the required metadata, this will return `null`.
   * @platform android
   * @platform ios
   */
  readonly currentOffsetFromLive: number | null;

  /**
   * Float value indicating the time offset from the live in seconds.
   * @platform ios
   */
  targetOffsetFromLive: number;

  /**
   * Float value indicating the duration of the current video in seconds.
   */
  readonly duration: number;

  /**
   * Float value between `0` and `1.0` representing the current volume.
   * Muting the player doesn't affect the volume. In other words, when the player is muted, the volume is the same as
   * when unmuted. Similarly, setting the volume doesn't unmute the player.
   * @default 1.0
   */
  volume: number;

  /**
   * Boolean value indicating if the player should correct audio pitch when the playback speed changes.
   * @default true
   */
  preservesPitch: boolean;

  /**
   * Float value indicating the interval in seconds at which the player will emit the [`timeUpdate`](#videoplayerevents) event.
   * When the value is equal to `0`, the event will not be emitted.
   *
   * @default 0
   */
  timeUpdateEventInterval: number;

  /**
   * Float value between `0` and `16.0` indicating the current playback speed of the player.
   * @default 1.0
   */
  playbackRate: number;

  /**
   * Boolean value indicating whether the player is currently playing a live stream.
   */
  readonly isLive: boolean;

  /**
   * Indicates the current status of the player.
   */
  readonly status: VideoPlayerStatus;

  /**
   * Boolean value determining whether the player should show the now playing notification.
   *
   * @default false
   * @platform android
   * @platform ios
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
   * Float value indicating how far the player has buffered the video in seconds.
   *
   * This value is 0 when the player has not buffered up to the current playback time.
   * When it's impossible to determine the buffer state (for example, when the player isn't playing any media), this value is -1.
   */
  readonly bufferedPosition: number;

  /**
   * Specifies buffer options which will be used by the player when buffering the video.
   *
   * > You should provide a `BufferOptions` object when setting this property. Setting individual buffer properties is not supported.
   * @platform android
   * @platform ios
   */
  bufferOptions: BufferOptions;

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
  statusChange(
    newStatus: VideoPlayerStatus,
    oldStatus: VideoPlayerStatus,
    error?: PlayerError
  ): void;
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
   * Handler for an event emitted in a given interval specified by the `timeUpdateEventInterval`.
   */
  timeUpdate(timeUpdate: TimeUpdate): void;
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

export type VideoSource =
  | string
  | number
  | null
  | {
      /**
       * The URI of the video.
       *
       * This property is exclusive with the `assetId` property. When both are present, the `assetId` will be ignored.
       */
      uri?: string;

      /**
       * The asset ID of a local video asset, acquired with the `require` function.
       * This property is exclusive with the `uri` property. When both are present, the `assetId` will be ignored.
       */
      assetId?: number;

      /**
       * Specifies the DRM options which will be used by the player while loading the video.
       */
      drm?: DRMOptions;

      /**
       * Specifies information which will be displayed in the now playing notification.
       * When undefined the player will display information contained in the video metadata.
       */
      metadata?: VideoMetadata;

      /**
       * Specifies headers sent with the video request.
       * > For DRM license headers use the `headers` field of [`DRMOptions`](#drmoptions).
       * @platform android
       * @platform ios
       */
      headers?: Record<string, string>;
    };

/**
 * Contains information about any errors that the player encountered during the playback
 */
export type PlayerError = {
  message: string;
};

/**
 * Player volume related information returned inside `volumeChange` event.
 */
export type VolumeEvent = {
  /**
   * Float value representing the current volume.
   */
  volume: number;
  /**
   * Flag showing if the player is currently muted.
   */
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
 * Specifies which type of DRM to use:
 * - Android supports ClearKey, PlayReady and Widevine.
 * - iOS supports FairPlay.
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
  headers?: Record<string, string>;

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

  /**
   * Specifies the base64 encoded certificate data for the FairPlay DRM.
   * When this property is set, the `certificateUrl` property is ignored.
   * @platform ios
   */
  base64CertificateData?: string;
};

/**
 * Data delivered with the [`timeUpdate`](#videoplayerevents) event, contains information about the current playback progress.
 */
export type TimeUpdate = {
  /**
   * Float value indicating the current playback time in seconds. Same as the [`currentTime`](#currenttime) property.
   */
  currentTime: number;
  /**
   * The exact timestamp when the currently displayed video frame was sent from the server,
   * based on the `EXT-X-PROGRAM-DATE-TIME` tag in the livestream metadata.
   * Same as the [`currentLiveTimestamp`](#currentlivetimestamp) property.
   * @platform android
   * @platform ios
   */
  currentLiveTimestamp: number | null;
  /**
   * Float value indicating the latency of the live stream in seconds.
   * Same as the [`currentOffsetFromLive`](#currentoffsetfromlive) property.
   * @platform android
   * @platform ios
   */
  currentOffsetFromLive: number | null;

  /**
   * Float value indicating how far the player has buffered the video in seconds
   * Same as the [`bufferedPosition`](#bufferetPosition) property
   * @platform android
   * @platform ios
   */
  bufferedPosition: number;
};

/**
 * Specifies buffer options which will be used by the player when buffering the video.
 *
 * @platform android
 * @platform ios
 */
export type BufferOptions = {
  /**
   * The duration in seconds which determines how much media the player should buffer ahead of the current playback time.
   *
   * On iOS when set to 0 the player will automatically decide appropriate buffer duration.
   *
   * Equivalent to [`AVPlayerItem.preferredForwardBufferDuration`](https://developer.apple.com/documentation/avfoundation/avplayeritem/1643630-preferredforwardbufferduration).
   * @default Android: 20, iOS: 0
   * @platform android
   * @platform ios
   */
  readonly preferredForwardBufferDuration?: number;

  /**
   * A Boolean value that indicates whether the player should automatically delay playback in order to minimize stalling.
   *
   * Equivalent to [`AVPlayer.automaticallyWaitsToMinimizeStalling`](https://developer.apple.com/documentation/avfoundation/avplayer/1643482-automaticallywaitstominimizestal).
   * @default true
   * @platform ios
   */
  readonly waitsToMinimizeStalling?: boolean;

  /**
   * Minimum duration of the buffer in seconds required to continue playing after the player has been paused or started buffering.
   *
   * > This property will be ignored if `preferredForwardBufferDuration` is lower.
   * @default 2
   * @platform android
   */
  readonly minBufferForPlayback?: number;

  /**
   * The maximum number of bytes that the player can buffer from the network.
   * When 0 the player will automatically decide appropriate buffer size.
   *
   * @default 0
   * @platform android
   */
  readonly maxBufferBytes?: number | null;

  /**
   * A Boolean value which determines whether the player should prioritize time over size when buffering media.
   *
   * @default false
   * @platform android
   */
  readonly prioritizeTimeOverSizeThreshold?: boolean;
};
