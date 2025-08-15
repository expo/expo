import {
  PlayerError,
  SubtitleTrack,
  VideoPlayerStatus,
  VideoSource,
  VideoTrack,
  AudioTrack,
} from './VideoPlayer.types';

/**
 * Handlers for events which can be emitted by the player.
 */
export type VideoPlayerEvents = {
  /**
   * Handler for an event emitted when the status of the player changes.
   */
  statusChange(payload: StatusChangeEventPayload): void;

  /**
   * Handler for an event emitted when the player starts or stops playback.
   */
  playingChange(payload: PlayingChangeEventPayload): void;

  /**
   * Handler for an event emitted when the `playbackRate` property of the player changes.
   */
  playbackRateChange(payload: PlaybackRateChangeEventPayload): void;

  /**
   * Handler for an event emitted when the `volume` of `muted` property of the player changes.
   */
  volumeChange(payload: VolumeChangeEventPayload): void;

  /**
   * Handler for an event emitted when the `muted` property of the player changes
   */
  mutedChange(payload: MutedChangeEventPayload): void;

  /**
   * Handler for an event emitted when the player plays to the end of the current source.
   */
  playToEnd(): void;

  /**
   * Handler for an event emitted in a given interval specified by the `timeUpdateEventInterval`.
   */
  timeUpdate(payload: TimeUpdateEventPayload): void;

  /**
   * Handler for an event emitted when the current media source of the player changes.
   */
  sourceChange(payload: SourceChangeEventPayload): void;

  /**
   * Handler for an event emitted when the available subtitle tracks change.
   */
  availableSubtitleTracksChange(payload: AvailableSubtitleTracksChangeEventPayload): void;

  /**
   * Handler for an event emitted when the current subtitle track changes.
   */
  subtitleTrackChange(payload: SubtitleTrackChangeEventPayload): void;

  /**
   * Handler for an event emitted when the available audio tracks change.
   */
  availableAudioTracksChange(payload: AvailableAudioTracksChangeEventPayload): void;

  /**
   * Handler for an event emitted when the current audio track changes.
   */
  audioTrackChange(payload: AudioTrackChangeEventPayload): void;

  /**
   * Handler for an event emitted when the current video track changes.
   */
  videoTrackChange(payload: VideoTrackChangeEventPayload): void;

  /**
   * Handler for an event emitted when the player has finished loading metadata for the current video source.
   * This event is emitted when the player has finished metadata for a [`VideoSource`](#videosource), but it doesn't mean that there is enough data buffered to start the playback.
   */
  sourceLoad(payload: SourceLoadEventPayload): void;

  /**
   * Handler for an event emitted when the video player starts or stops sharing the video via AirPlay.
   *
   * @platform ios
   */
  isExternalPlaybackActiveChange(payload: IsExternalPlaybackActiveChangeEventPayload): void;
};

/**
 * Data delivered with the [`statusChange`](#videoplayerevents) event.
 */
export type StatusChangeEventPayload = {
  /**
   * New status of the player.
   */
  status: VideoPlayerStatus;

  /**
   * Previous status of the player.
   */
  oldStatus?: VideoPlayerStatus;

  /**
   * Error object containing information about the error that occurred.
   */
  error?: PlayerError;
};

/**
 * Data delivered with the [`playingChange`](#videoplayerevents) event.
 */
export type PlayingChangeEventPayload = {
  /**
   * Boolean value whether the player is currently playing.
   */
  isPlaying: boolean;

  /**
   * Previous value of the `isPlaying` property.
   */
  oldIsPlaying?: boolean;
};

/**
 * Data delivered with the [`playbackRateChange`](#videoplayerevents) event.
 */
export type PlaybackRateChangeEventPayload = {
  /**
   * Float value indicating the current playback speed of the player.
   */
  playbackRate: number;

  /**
   * Previous value of the `playbackRate` property.
   */
  oldPlaybackRate?: number;
};

/**
 * Data delivered with the [`volumeChange`](#videoplayerevents) event.
 */
export type VolumeChangeEventPayload = {
  /**
   * Float value indicating the current volume of the player.
   */
  volume: number;

  /**
   * Previous value of the `volume` property.
   */
  oldVolume?: number;
};

/**
 * Data delivered with the [`mutedChange`](#videoplayerevents) event.
 */
export type MutedChangeEventPayload = {
  /**
   * Boolean value whether the player is currently muted.
   */
  muted: boolean;

  /**
   * Previous value of the `isMuted` property.
   */
  oldMuted?: boolean;
};

/**
 * Data delivered with the [`sourceChange`](#videoplayerevents) event.
 */
export type SourceChangeEventPayload = {
  /**
   * New source of the player.
   */
  source: VideoSource;

  /**
   * Previous source of the player.
   */
  oldSource?: VideoSource;
};

/**
 * Data delivered with the [`timeUpdate`](#videoplayerevents) event, contains information about the current playback progress.
 */
export type TimeUpdateEventPayload = {
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
   * Float value indicating how far the player has buffered the video in seconds.
   * Same as the [`bufferedPosition`](#bufferedPosition) property.
   * @platform android
   * @platform ios
   */
  bufferedPosition: number;
};

export type SubtitleTrackChangeEventPayload = {
  /**
   * New subtitle track of the player.
   */
  subtitleTrack: SubtitleTrack | null;

  /**
   * Previous subtitle track of the player.
   */
  oldSubtitleTrack?: SubtitleTrack | null;
};

/**
 * Data delivered with the [`videoTrackChange`](#videoplayerevents) event, contains information about the video track which is currently being played.
 */
export type VideoTrackChangeEventPayload = {
  /**
   * New video track of the player.
   */
  videoTrack: VideoTrack | null;

  /**
   * Previous video track of the player.
   */
  oldVideoTrack?: VideoTrack | null;
};

/**
 * TODO @behenate: For SDK53 mark as deprecated in favor of SourceLoadEventPayload
 * @hidden
 */
export type AvailableSubtitleTracksChangeEventPayload = {
  /**
   * Array of available subtitle tracks.
   */
  availableSubtitleTracks: SubtitleTrack[];

  /**
   * Previous array of available subtitle tracks.
   */
  oldAvailableSubtitleTracks?: SubtitleTrack[];
};

/**
 * Data delivered with the [`sourceLoad`](#videoplayerevents) event, contains information about the video source that has finished loading.
 */
export type SourceLoadEventPayload = {
  /**
   * The video source that has been loaded.
   */
  videoSource: VideoSource | null;

  /**
   * Duration of the video source in seconds.
   */
  duration: number;

  /**
   * Video tracks available for the loaded video source.
   *
   * > On iOS, when using a HLS source, make sure that the uri contains `.m3u8` extension or that the [`contentType`](#contenttype) property of the [`VideoSource`](#videosource) has been set to `'hls'`. Otherwise, the video tracks will not be available.
   */
  availableVideoTracks: VideoTrack[];

  /**
   * Subtitle tracks available for the loaded video source.
   */
  availableSubtitleTracks: SubtitleTrack[];

  /**
   * Audio tracks available for the loaded video source.
   */
  availableAudioTracks: AudioTrack[];
};

type AudioTrackChangeEventPayload = {
  /**
   * New audio track of the player.
   */
  audioTrack: AudioTrack | null;

  /**
   * Previous audio track of the player.
   */
  oldAudioTrack?: AudioTrack | null;
};

type AvailableAudioTracksChangeEventPayload = {
  /**
   * Array of available audio tracks.
   */
  availableAudioTracks: AudioTrack[];

  /**
   * Previous array of available audio tracks.
   */
  oldAvailableAudioTracks?: AudioTrack[];
};

export type IsExternalPlaybackActiveChangeEventPayload = {
  /**
   * The current external playback status.
   */
  isExternalPlaybackActive: boolean;

  /**
   * The previous external playback status.
   */
  oldIsExternalPlaybackActive?: boolean;
};
