import { Recording } from './Recording';
import {
  AndroidAudioEncoder,
  AndroidOutputFormat,
  IOSAudioQuality,
  IOSOutputFormat,
} from './RecordingConstants';

// TODO: For consistency with PlaybackStatus, should we include progressUpdateIntervalMillis here as well?

// @needsAudit
export type RecordingStatus = {
  /**
   * A boolean describing if the `Recording` can initiate the recording.
   */
  canRecord: boolean;
  /**
   * A boolean describing if the `Recording` is currently recording.
   */
  isRecording: boolean;
  /**
   * A boolean describing if the `Recording` has been stopped.
   */
  isDoneRecording: boolean;
  /**
   * The current duration of the recorded audio or the final duration is the recording has been stopped.
   */
  durationMillis: number;
  /**
   * A number that's the most recent reading of the loudness in dB. The value ranges from `–160` dBFS, indicating minimum power,
   * to `0` dBFS, indicating maximum power. Present or not based on Recording options. See `RecordingOptions` for more information.
   */
  metering?: number;
  // @docsMissing
  uri?: string | null;
  /**
   * A boolean indicating whether media services were reset during recording. This may occur if the active input ceases to be available
   * during recording.
   *
   * For example: airpods are the active input and they run out of batteries during recording.
   *
   * @platform ios
   */
  mediaServicesDidReset?: boolean;
};

// @needsAudit
export type RecordingOptionsAndroid = {
  /**
   * The desired file extension. Example valid values are `.3gp` and `.m4a`.
   * For more information, see the [Android docs](https://developer.android.com/guide/topics/media/media-formats)
   * for supported output formats.
   */
  extension: string;
  /**
   * The desired file format. See the [`AndroidOutputFormat`](#androidoutputformat) enum for all valid values.
   */
  outputFormat: AndroidOutputFormat | number;
  /**
   * The desired audio encoder. See the [`AndroidAudioEncoder`](#androidaudioencoder) enum for all valid values.
   */
  audioEncoder: AndroidAudioEncoder | number;
  /**
   * The desired sample rate.
   *
   * Note that the sampling rate depends on the format for the audio recording, as well as the capabilities of the platform.
   * For instance, the sampling rate supported by AAC audio coding standard ranges from 8 to 96 kHz,
   * the sampling rate supported by AMRNB is 8kHz, and the sampling rate supported by AMRWB is 16kHz.
   * Please consult with the related audio coding standard for the supported audio sampling rate.
   *
   * @example 44100
   */
  sampleRate?: number;
  /**
   * The desired number of channels.
   *
   * Note that `prepareToRecordAsync()` may perform additional checks on the parameter to make sure whether the specified
   * number of audio channels are applicable.
   *
   * @example `1`, `2`
   */
  numberOfChannels?: number;
  /**
   * The desired bit rate.
   *
   * Note that `prepareToRecordAsync()` may perform additional checks on the parameter to make sure whether the specified
   * bit rate is applicable, and sometimes the passed bitRate will be clipped internally to ensure the audio recording
   * can proceed smoothly based on the capabilities of the platform.
   *
   * @example `128000`
   */
  bitRate?: number;
  /**
   * The desired maximum file size in bytes, after which the recording will stop (but `stopAndUnloadAsync()` must still
   * be called after this point).
   *
   * @example `65536`
   */
  maxFileSize?: number;
};

// @needsAudit
export type RecordingOptionsIOS = {
  /**
   * The desired file extension.
   *
   * @example `'.caf'`
   */
  extension: string;
  /**
   * The desired file format. See the [`IOSOutputFormat`](#iosoutputformat) enum for all valid values.
   */
  outputFormat?: string | IOSOutputFormat | number;
  /**
   * The desired audio quality. See the [`IOSAudioQuality`](#iosaudioquality) enum for all valid values.
   */
  audioQuality: IOSAudioQuality | number;
  /**
   * The desired sample rate.
   *
   * @example `44100`
   */
  sampleRate: number;
  /**
   * The desired number of channels.
   *
   * @example `1`, `2`
   */
  numberOfChannels: number;
  /**
   * The desired bit rate.
   *
   * @example `128000`
   */
  bitRate: number;
  /**
   * The desired bit rate strategy. See the next section for an enumeration of all valid values of `bitRateStrategy`.
   */
  bitRateStrategy?: number;
  /**
   * The desired bit depth hint.
   *
   * @example `16`
   */
  bitDepthHint?: number;
  /**
   * The desired PCM bit depth.
   *
   * @example `16`
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

// @docsMissing
export type RecordingOptionsWeb = {
  mimeType?: string;
  bitsPerSecond?: number;
};

// @needsAudit
/**
 * The recording extension, sample rate, bitrate, channels, format, encoder, etc. which can be customized by passing options to `prepareToRecordAsync()`.
 *
 * We provide the following preset options for convenience, as used in the example above. See below for the definitions of these presets.
 * - `Audio.RecordingOptionsPresets.HIGH_QUALITY`
 * - `Audio.RecordingOptionsPresets.LOW_QUALITY`
 *
 * We also provide the ability to define your own custom recording options, but **we recommend you use the presets,
 * as not all combinations of options will allow you to successfully `prepareToRecordAsync()`.**
 * You will have to test your custom options on iOS and Android to make sure it's working. In the future,
 * we will enumerate all possible valid combinations, but at this time, our goal is to make the basic use-case easy (with presets)
 * and the advanced use-case possible (by exposing all the functionality available on all supported platforms).
 */
export type RecordingOptions = {
  /**
   * A boolean that determines whether audio level information will be part of the status object under the "metering" key.
   */
  isMeteringEnabled?: boolean;
  /**
   * A boolean that hints to keep the audio active after `prepareToRecordAsync` completes.
   * Setting this value can improve the speed at which the recording starts. Only set this value to `true` when you call `startAsync`
   * immediately after `prepareToRecordAsync`. This value is automatically set when using `Audio.recording.createAsync()`.
   */
  keepAudioActiveHint?: boolean;
  /**
   * Recording options for the Android platform.
   */
  android: RecordingOptionsAndroid;
  /**
   * Recording options for the iOS platform.
   */
  ios: RecordingOptionsIOS;
  /**
   * Recording options for the Web platform.
   */
  web: RecordingOptionsWeb;
};

// @docsMissing
export type RecordingInput = {
  name: string;
  type: string;
  uid: string;
};

// @needsAudit
export type RecordingObject = {
  /**
   * The newly created and started `Recording` object.
   */
  recording: Recording;
  /**
   * The `RecordingStatus` of the `Recording` object. See the [AV documentation](/versions/latest/sdk/av) for further information.
   */
  status: RecordingStatus;
};
