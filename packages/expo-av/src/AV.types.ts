import { Asset } from 'expo-asset';

import ExponentAV from './ExponentAV';

// @needsAudit
/**
 * Check [official Apple documentation](https://developer.apple.com/documentation/avfoundation/audio_settings/time_pitch_algorithm_settings) for more information.
 */
export enum PitchCorrectionQuality {
  /**
   * Equivalent to `AVAudioTimePitchAlgorithmLowQualityZeroLatency`.
   */
  Low = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.Low,
  /**
   * Equivalent to `AVAudioTimePitchAlgorithmTimeDomain`.
   */
  Medium = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.Medium,
  /**
   * Equivalent to `AVAudioTimePitchAlgorithmSpectral`.
   */
  High = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.High,
}

// @needsAudit
/**
 * The following forms of source are supported:
 * - A dictionary of the form `AVPlaybackSourceObject`.
 *   The `overrideFileExtensionAndroid` property may come in handy if the player receives an URL like `example.com/play` which redirects to `example.com/player.m3u8`.
 *   Setting this property to `m3u8` would allow the Android player to properly infer the content type of the media and use proper media file reader.
 * - `require('path/to/file')` for a media file asset in the source code directory.
 * - An [`Asset`](./asset) object for a media file asset.
 *
 * The [iOS developer documentation](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/OSX_Technology_Overview/MediaLayer/MediaLayer.html)
 * lists the audio and video formats supported on iOS.
 *
 * There are two sets of audio and video formats supported on Android: [formats supported by ExoPlayer](https://exoplayer.dev/supported-formats.html)
 * and [formats supported by Android's MediaPlayer](https://developer.android.com/guide/topics/media/platform/supported-formats#formats-table).
 * Expo uses ExoPlayer implementation by default. To use `MediaPlayer`, add `androidImplementation: 'MediaPlayer'` to the initial status of the AV object.
 */
export type AVPlaybackSource = number | AVPlaybackSourceObject | Asset;

// @needsAudit
/**
 * One of the possible forms of the `AVPlaybackSource`.
 */
export type AVPlaybackSourceObject = {
  /**
   * A network URL pointing to a media file.
   */
  uri: string;
  /**
   * An optional string overriding extension inferred from the URL.
   * @platform android
   */
  overrideFileExtensionAndroid?: string;
  /**
   * An optional headers object passed in a network request.
   */
  headers?: Record<string, string>;
};

/**
 * @hidden
 */
export type AVPlaybackNativeSource = {
  uri: string;
  overridingExtension?: string | null;
  headers?: Record<string, string>;
};

// @needsAudit
/**
 * Object passed to the `onMetadataUpdate` function.
 */
export type AVMetadata = {
  /**
   * A string with the title of the sound object.
   */
  title?: string;
};

// @needsAudit
/**
 * This is the structure returned from all playback API calls and describes the state of the `playbackObject` at that point in time.
 * It can take a form of `AVPlaybackStatusSuccess` or `AVPlaybackStatusError` based on the `playbackObject` load status.
 */
export type AVPlaybackStatus = AVPlaybackStatusError | AVPlaybackStatusSuccess;

// @needsAudit
export type AVPlaybackStatusError = {
  /**
   * A boolean set to `false`.
   */
  isLoaded: false;
  /**
   * Underlying implementation to use (when set to `MediaPlayer` it uses [Android's MediaPlayer](https://developer.android.com/reference/android/media/MediaPlayer.html),
   * uses [ExoPlayer](https://exoplayer.dev/) otherwise). You may need to use this property if you're trying to play an item unsupported by ExoPlayer
   * ([formats supported by ExoPlayer](https://exoplayer.dev/supported-formats.html), [formats supported by Android's MediaPlayer](https://developer.android.com/guide/topics/media/platform/supported-formats#formats-table)).
   *
   * Note that setting this property takes effect only when the AV object is just being created (toggling its value later will do nothing).
   *
   * @platform android
   */
  androidImplementation?: string;
  /**
   * A string only present if the `playbackObject` just encountered a fatal error and forced unload.
   * Populated exactly once when an error forces the object to unload.
   */
  error?: string;
};

// @needsAudit
export type AVPlaybackStatusSuccess = {
  /**
   * A boolean set to `true`.
   */
  isLoaded: true;
  /**
   * Underlying implementation to use (when set to `MediaPlayer` it uses [Android's MediaPlayer](https://developer.android.com/reference/android/media/MediaPlayer.html),
   * uses [ExoPlayer](https://exoplayer.dev/) otherwise). You may need to use this property if you're trying to play an item unsupported by ExoPlayer
   * ([formats supported by ExoPlayer](https://exoplayer.dev/supported-formats.html), [formats supported by Android's MediaPlayer](https://developer.android.com/guide/topics/media/platform/supported-formats#formats-table)).
   *
   * Note that setting this property takes effect only when the AV object is just being created (toggling its value later will do nothing).
   *
   * @platform android
   */
  androidImplementation?: string;
  /**
   * The location of the media source.
   */
  uri: string;
  /**
   * The minimum interval in milliseconds between calls of `onPlaybackStatusUpdate`. See `setOnPlaybackStatusUpdate()` for details.
   */
  progressUpdateIntervalMillis: number;
  /**
   * The duration of the media in milliseconds. This is only present if the media has a duration.
   * > Note that in some cases, a media file's duration is readable on Android, but not on iOS.
   */
  durationMillis?: number;
  /**
   * The current position of playback in milliseconds.
   */
  positionMillis: number;
  /**
   * The position until which the media has been buffered into memory. Like `durationMillis`, this is only present in some cases.
   */
  playableDurationMillis?: number;
  // @docsMissing
  seekMillisToleranceBefore?: number;
  // @docsMissing
  seekMillisToleranceAfter?: number;
  /**
   * A boolean describing if the media is supposed to play.
   */
  shouldPlay: boolean;
  /**
   * A boolean describing if the media is currently playing.
   */
  isPlaying: boolean;
  /**
   * A boolean describing if the media is currently buffering.
   */
  isBuffering: boolean;
  /**
   * The current rate of the media.
   */
  rate: number;
  /**
   * A boolean describing if we are correcting the pitch for a changed rate.
   */
  shouldCorrectPitch: boolean;
  /**
   * iOS time pitch algorithm setting. See `setRateAsync` for details.
   */
  pitchCorrectionQuality?: PitchCorrectionQuality;
  /**
   * The current volume of the audio for this media.
   */
  volume: number;
  /**
   * A boolean describing if the audio of this media is currently muted.
   */
  isMuted: boolean;
  /**
   * The current audio panning value of the audio for this media.
   */
  audioPan: number;
  /**
   * A boolean describing if the media is currently looping.
   */
  isLooping: boolean;
  /**
   * A boolean describing if the media just played to completion at the time that this status was received.
   * When the media plays to completion, the function passed in `setOnPlaybackStatusUpdate()` is called exactly once
   * with `didJustFinish` set to `true`. `didJustFinish` is never `true` in any other case.
   */
  didJustFinish: boolean;
};

// @needsAudit
/**
 * This is the structure passed to `setStatusAsync()` to modify the state of the `playbackObject`.
 */
export type AVPlaybackStatusToSet = {
  /**
   * Underlying implementation to use (when set to `MediaPlayer` it uses [Android's MediaPlayer](https://developer.android.com/reference/android/media/MediaPlayer.html),
   * uses [ExoPlayer](https://exoplayer.dev/) otherwise). You may need to use this property if you're trying to play an item unsupported by ExoPlayer
   * ([formats supported by ExoPlayer](https://exoplayer.dev/supported-formats.html), [formats supported by Android's MediaPlayer](https://developer.android.com/guide/topics/media/platform/supported-formats#formats-table)).
   *
   * Note that setting this property takes effect only when the AV object is just being created (toggling its value later will do nothing).
   *
   * @platform android
   */
  androidImplementation?: string;
  /**
   * The minimum interval in milliseconds between calls of `onPlaybackStatusUpdate`. See `setOnPlaybackStatusUpdate()` for details.
   */
  progressUpdateIntervalMillis?: number;
  /**
   * The current position of playback in milliseconds.
   */
  positionMillis?: number;
  // @docsMissing
  seekMillisToleranceBefore?: number;
  // @docsMissing
  seekMillisToleranceAfter?: number;
  /**
   * A boolean describing if the media is supposed to play.
   */
  shouldPlay?: boolean;
  /**
   * The current rate of the media.
   * @platform android API 23+
   * @platform ios
   */
  rate?: number;
  /**
   * A boolean describing if we are correcting the pitch for a changed rate.
   */
  shouldCorrectPitch?: boolean;
  /**
   * The current volume of the audio for this media.
   * > Note that this only affect the audio of this `playbackObject` and do NOT affect the system volume.
   */
  volume?: number;
  /**
   * A boolean describing if the audio of this media is currently muted.
   * > Note that this only affect the audio of this `playbackObject` and do NOT affect the system volume.
   */
  isMuted?: boolean;
  /**
   * The current audio panning value of the audio for this media.
   * > Note that this only affect the audio of this `playbackObject` and do NOT affect the system volume.
   * > Also note that this is only available when the video was loaded using `androidImplementation: 'MediaPlayer'`
   * @platform android
   */
  audioPan?: number;
  /**
   * A boolean describing if the media is currently looping.
   */
  isLooping?: boolean;
  /**
   * iOS time pitch algorithm setting. See `setRateAsync` for details.
   */
  pitchCorrectionQuality?: PitchCorrectionQuality;
};

// @docsMissing
export type AVPlaybackTolerance = { toleranceMillisBefore?: number; toleranceMillisAfter?: number };
