import { AudioQuality, IOSOutputFormat } from './RecordingConstants';

// @docsMissing
export type AudioSource =
  | string
  | number
  | null
  | {
      /**
       * A string representing the resource identifier for the audio,
       * which could be an HTTPS address, a local file path, or the name of a static audio file resource.
       */
      uri?: string;
      /**
       * The asset ID of a local audio asset, acquired with the `require` function.
       * This property is exclusive with the `uri` property. When both are present, the `assetId` will be ignored.
       */
      assetId?: number;
      /**
       * An object representing the HTTP headers to send along with the request for a remote audio source.
       * On web requires the `Access-Control-Allow-Origin` header returned by the server to include the current domain.
       */
      headers?: Record<string, string>;
    };

/**
 * Options for configuring audio player behavior.
 */
export type AudioPlayerOptions = {
  /**
   * How often (in milliseconds) to emit playback status updates. Defaults to 500ms.
   *
   * @example
   * ```tsx
   * import { useAudioPlayer } from 'expo-audio';
   *
   * export default function App() {
   *   const player = useAudioPlayer(source);
   *
   *   // High-frequency updates for smooth progress bars
   *   const player = useAudioPlayer(source, { updateInterval: 100 });
   *
   *   // Standard updates (default behavior)
   *   const player = useAudioPlayer(source, { updateInterval: 500 });
   *
   *   // Low-frequency updates for better performance
   *   const player = useAudioPlayer(source, { updateInterval: 1000 });
   * }
   * ```
   *
   * @default 500ms
   *
   * @platform ios
   * @platform android
   * @platform web
   */
  updateInterval?: number;
  /**
   * If set to `true`, the system will attempt to download the resource to the device before loading.
   * This value defaults to `false`.
   *
   * Works with:
   * - Local assets from `require('path/to/file')`
   * - Remote HTTP/HTTPS URLs
   * - Asset objects
   *
   * When enabled, this ensures the audio file is fully downloaded before playback begins.
   * This can improve playback performance and reduce buffering, especially for users
   * managing multiple audio players simultaneously.
   *
   * On Android and iOS, this will download the audio file to the device's tmp directory before playback begins.
   * The system will purge the file at its discretion.
   *
   * On web, this will download the audio file to the user's device memory and make it available for the user to play.
   * The system will usually purge the file from memory after a reload or on memory pressure.
   * On web, CORS restrictions apply to the blob url, so you need to make sure the server returns the `Access-Control-Allow-Origin` header.
   *
   * @platform ios
   * @platform web
   * @platform android
   */
  downloadFirst?: boolean;
  /**
   * Determines the [cross origin policy](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/crossorigin) used by the underlying native view on web.
   * If `undefined` (default), does not use CORS at all. If set to `'anonymous'`, the audio will be loaded with CORS enabled.
   * Note that some audio may not play if CORS is enabled, depending on the CDN settings.
   * If you encounter issues, consider adjusting the `crossOrigin` property.
   *
   *
   * @platform web
   * @default undefined
   */
  crossOrigin?: 'anonymous' | 'use-credentials';
  /**
   * If set to `true`, the audio session will not be deactivated when this player pauses or finishes playback.
   * This prevents interrupting other audio sources (like videos) when the audio ends.
   *
   * Useful for sound effects that should not interfere with ongoing video playback or other audio.
   * The audio session for this player will not be deactivated automatically when the player finishes playback.
   *
   * > **Note:** If needed, you can manually deactivate the audio session using `setIsAudioActiveAsync(false)`.
   *
   * @platform ios
   * @default false
   */
  keepAudioSessionActive?: boolean;
};

/**
 * @deprecated Use `AudioPlayerOptions` instead.
 * Options for audio loading behavior.
 */
export type AudioLoadOptions = AudioPlayerOptions;

/**
 * Represents an available audio input device for recording.
 *
 * This type describes audio input sources like built-in microphones, external microphones,
 * or other audio input devices that can be used for recording. Each input has an identifying
 * information that can be used to select the preferred recording source.
 */
export type RecordingInput = {
  /** Human-readable name of the audio input device. */
  name: string;
  /** Type or category of the input device (for example, 'Built-in Microphone', 'External Microphone'). */
  type: string;
  /** Unique identifier for the input device, used to select the input ('Built-in Microphone', 'External Microphone') for recording. */
  uid: string;
};

/**
 * Pitch correction quality settings for audio playback rate changes.
 *
 * When changing playback rate, pitch correction can be applied to maintain the original pitch.
 * Different quality levels offer trade-offs between processing power and audio quality.
 *
 * @platform ios
 */
export type PitchCorrectionQuality = 'low' | 'medium' | 'high';

/**
 * Comprehensive status information for an `AudioPlayer`.
 *
 * This object contains all the current state information about audio playback,
 * including playback position, duration, loading state, and playback settings.
 * Used by `useAudioPlayerStatus()` to provide real-time status updates.
 */
export type AudioStatus = {
  /** Unique identifier for the player instance. */
  id: number;
  /** Current playback position in seconds. */
  currentTime: number;
  /** String representation of the player's internal playback state. */
  playbackState: string;
  /** String representation of the player's time control status (playing/paused/waiting). */
  timeControlStatus: string;
  /** Reason why the player is waiting to play (if applicable). */
  reasonForWaitingToPlay: string;
  /** Whether the player is currently muted. */
  mute: boolean;
  /** Total duration of the audio in seconds, or 0 if not yet determined. */
  duration: number;
  /** Whether the audio is currently playing. */
  playing: boolean;
  /** Whether the audio is set to loop when it reaches the end. */
  loop: boolean;
  /** Whether the audio just finished playing. */
  didJustFinish: boolean;
  /** Whether the player is currently buffering data. */
  isBuffering: boolean;
  /** Whether the audio has finished loading and is ready to play. */
  isLoaded: boolean;
  /** Current playback rate (1.0 = normal speed). */
  playbackRate: number;
  /** Whether pitch correction is enabled for rate changes. */
  shouldCorrectPitch: boolean;
};

/**
 * Status information for recording operations from the event system.
 *
 * This type represents the status data emitted by `recordingStatusUpdate` events.
 * It contains high-level information about the recording session and any errors.
 * Used internally by the event system. Most users should use `useAudioRecorderState()` instead.
 */
export type RecordingStatus = {
  /** Unique identifier for the recording session. */
  id: number;
  /** Whether the recording has finished (stopped). */
  isFinished: boolean;
  /** Whether an error occurred during recording. */
  hasError: boolean;
  /** Error message if an error occurred, `null` otherwise. */
  error: string | null;
  /** File URL of the completed recording, if available. */
  url: string | null;
};

/**
 * Current state information for an `AudioRecorder`.
 *
 * This object contains detailed information about the recorder's current state,
 * including recording status, duration, and technical details. This is what you get
 * when calling `recorder.getStatus()` or using `useAudioRecorderState()`.
 */
export type RecorderState = {
  /** Whether the recorder is ready and able to record. */
  canRecord: boolean;
  /** Whether recording is currently in progress. */
  isRecording: boolean;
  /** Duration of the current recording in milliseconds. */
  durationMillis: number;
  /** Whether the media services have been reset (typically indicates a system interruption). */
  mediaServicesDidReset: boolean;
  /** Current audio level/volume being recorded (if metering is enabled). */
  metering?: number;
  /** File URL where the recording will be saved, if available. */
  url: string | null;
};

/**
 * Audio output format options for Android recording.
 *
 * Specifies the container format for recorded audio files on Android.
 * Different formats have different compatibility and compression characteristics.
 *
 * @platform android
 */
export type AndroidOutputFormat =
  | 'default'
  | '3gp'
  | 'mpeg4'
  | 'amrnb'
  | 'amrwb'
  | 'aac_adts'
  | 'mpeg2ts'
  | 'webm';

/**
 * Audio encoder options for Android recording.
 *
 * Specifies the audio codec used to encode recorded audio on Android.
 * Different encoders offer different quality, compression, and compatibility trade-offs.
 *
 * @platform android
 */
export type AndroidAudioEncoder = 'default' | 'amr_nb' | 'amr_wb' | 'aac' | 'he_aac' | 'aac_eld';

/**
 * Bit rate strategies for audio encoding.
 *
 * Determines how the encoder manages bit rate during recording, affecting
 * file size consistency and quality characteristics.
 */
export type BitRateStrategy = 'constant' | 'longTermAverage' | 'variableConstrained' | 'variable';

/**
 * Options for controlling how audio recording is started.
 */
export type RecordingStartOptions = {
  /**
   * The duration in seconds after which recording should automatically stop.
   * If not provided, recording continues until manually stopped.
   *
   * @platform ios
   * @platform android
   * @platform web
   */
  forDuration?: number;
  /**
   * The time in seconds to wait before starting the recording.
   * If not provided, recording starts immediately.
   *
   * **Platform behavior:**
   * - Android: Ignored, recording starts immediately
   * - iOS: Uses native AVAudioRecorder.record(atTime:) for precise timing.
   * - Web: Ignored, recording starts immediately
   *
   * > **warning** On iOS, the recording process starts immediately (you'll see status updates),
   * but actual audio capture begins after the specified delay. This is not a countdown, since
   * the recorder is active but silent during the delay period.
   *
   * @platform ios
   */
  atTime?: number;
};

export type RecordingOptions = {
  /**
   * A boolean that determines whether audio level information will be part of the status object under the "metering" key.
   */
  isMeteringEnabled?: boolean;
  /**
   * The desired file extension.
   *
   * @example .caf
   */
  extension: string;
  /**
   * The desired sample rate.
   *
   * @example 44100
   */
  sampleRate: number;
  /**
   * The desired number of channels.
   *
   * @example 2
   */
  numberOfChannels: number;
  /**
   * The desired bit rate.
   *
   * @example 128000
   */
  bitRate: number;
  /**
   * Recording options for the Android platform.
   * @platform android
   */
  android: RecordingOptionsAndroid;
  /**
   * Recording options for the iOS platform.
   * @platform ios
   */
  ios: RecordingOptionsIos;
  /**
   * Recording options for the Web platform.
   * @platform web
   */
  web: RecordingOptionsWeb;
};

/**
 * Recording options for the web.
 *
 * Web recording uses the `MediaRecorder` API, which has different capabilities
 * compared to native platforms. These options map directly to `MediaRecorder` settings.
 *
 * @platform web
 */
export type RecordingOptionsWeb = {
  /** MIME type for the recording (for example, 'audio/webm', 'audio/mp4'). */
  mimeType?: string;
  /** Target bits per second for the recording. */
  bitsPerSecond?: number;
};

/**
 * Recording configuration options specific to iOS.
 *
 * iOS recording uses `AVAudioRecorder` with extensive format and quality options.
 * These settings provide fine-grained control over the recording characteristics.
 *
 * @platform ios
 */
export type RecordingOptionsIos = {
  /**
   * The desired file extension.
   *
   * @example .caf
   */
  extension?: string;
  /**
   * The desired sample rate.
   *
   * @example 44100
   */
  sampleRate?: number;
  /**
   * The desired file format. See the [`IOSOutputFormat`](#iosoutputformat) enum for all valid values.
   */
  outputFormat?: string | IOSOutputFormat | number;
  /**
   * The desired audio quality. See the [`AudioQuality`](#audioquality) enum for all valid values.
   */
  audioQuality: AudioQuality | number;
  /**
   * The desired bit rate strategy. See the next section for an enumeration of all valid values of `bitRateStrategy`.
   */
  bitRateStrategy?: number;
  /**
   * The desired bit depth hint.
   *
   * @example 16
   */
  bitDepthHint?: number;
  /**
   * The desired PCM bit depth.
   *
   * @example 16
   */
  linearPCMBitDepth?: number;
  /**
   * A boolean describing if the PCM data should be formatted in big endian.
   */
  linearPCMIsBigEndian?: boolean;
  /**
   * A boolean describing if the PCM data should be encoded in floating point or integral values.
   */
  linearPCMIsFloat?: boolean;
};

/**
 * Recording configuration options specific to Android.
 *
 * Android recording uses `MediaRecorder` with options for format, encoder, and file constraints.
 * These settings control the output format and quality characteristics.
 *
 * @platform android
 */
export type RecordingOptionsAndroid = {
  /**
   * The desired file extension.
   *
   * @example .caf
   */
  extension?: string;
  /**
   * The desired sample rate.
   *
   * @example 44100
   */
  sampleRate?: number;
  /**
   * The desired file format. See the [`AndroidOutputFormat`](#androidoutputformat) enum for all valid values.
   */
  outputFormat: AndroidOutputFormat;
  /**
   * The desired audio encoder. See the [`AndroidAudioEncoder`](#androidaudioencoder) enum for all valid values.
   */
  audioEncoder: AndroidAudioEncoder;
  /**
   * The desired maximum file size in bytes, after which the recording will stop (but `stopAndUnloadAsync()` must still
   * be called after this point).
   *
   * @example
   * `65536`
   */
  maxFileSize?: number;
  /**
   * The desired audio Source. See the [`AndroidAudioSource`](#androidaudiosource) enum for all valid values.
   */
  audioSource?: RecordingSource;
};

export type AudioMode = {
  /**
   * Determines if audio playback is allowed when the device is in silent mode.
   *
   * @platform ios
   */
  playsInSilentMode: boolean;
  /**
   * Determines how the audio session interacts with other sessions.
   *
   * @platform ios
   */
  interruptionMode: InterruptionMode;
  /**
   * Determines how the audio session interacts with other sessions on Android.
   *
   * @platform android
   */
  interruptionModeAndroid: InterruptionModeAndroid;
  /**
   * Whether the audio session allows recording.
   *
   * @default false
   * @platform ios
   */
  allowsRecording: boolean;
  /**
   * Whether the audio session stays active when the app moves to the background.
   * @default false
   */
  shouldPlayInBackground: boolean;
  /**
   * Whether the audio should route through the earpiece.
   * @platform android
   */
  shouldRouteThroughEarpiece: boolean;
};

/**
 * Audio interruption behavior modes for iOS.
 *
 * Controls how your app's audio interacts with other apps' audio when interruptions occur.
 * This affects what happens when phone calls, notifications, or other apps play audio.
 *
 * @platform ios
 */
export type InterruptionMode = 'mixWithOthers' | 'doNotMix' | 'duckOthers';

/**
 * Audio interruption behavior modes for Android.
 *
 * Controls how your app's audio interacts with other apps' audio on Android.
 * Note that Android doesn't support 'mixWithOthers' mode; audio focus is more strictly managed.
 *
 * @platform android
 */
export type InterruptionModeAndroid = 'doNotMix' | 'duckOthers';

/**
 * Recording source for android.
 *
 * An audio source defines both a default physical source of audio signal, and a recording configuration.
 *
 * - `camcorder`: Microphone audio source tuned for video recording, with the same orientation as the camera if available.
 * - `default`: The default audio source.
 * - `mic`: Microphone audio source.
 * - `unprocessed`: Microphone audio source tuned for unprocessed (raw) sound if available, behaves like `default` otherwise.
 * - `voice_communication`: Microphone audio source tuned for voice communications such as VoIP. It will for instance take advantage of echo cancellation or automatic gain control if available.
 * - `voice_performance`: Source for capturing audio meant to be processed in real time and played back for live performance (e.g karaoke). The capture path will minimize latency and coupling with playback path.
 * - `voice_recognition`: Microphone audio source tuned for voice recognition.
 *
 * @see https://developer.android.com/reference/android/media/MediaRecorder.AudioSource
 * @platform android
 */
export type RecordingSource =
  | 'camcorder'
  | 'default'
  | 'mic'
  | 'remote_submix'
  | 'unprocessed'
  | 'voice_communication'
  | 'voice_performance'
  | 'voice_recognition';
