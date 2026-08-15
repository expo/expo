import type { SharedObject } from 'expo';

import type { RecordingDirectory } from './Audio.types';

export type AudioStreamEncoding = 'float32' | 'int16';

export type AudioStreamOptions = {
  /**
   * Desired sample rate in Hz.
   * The actual rate may differ if the hardware cannot deliver it.
   * @default 48000
   */
  sampleRate?: number;

  /**
   * Number of audio channels. 1 for mono, 2 for stereo.
   * @default 1
   */
  channels?: number;

  /**
   * PCM encoding format.
   * @default 'float32'
   */
  encoding?: AudioStreamEncoding;

  /**
   * Called each time a new PCM buffer is captured from the microphone.
   */
  onBuffer?: (buffer: AudioStreamBuffer) => void;
};

export type AudioStreamBuffer = {
  /**
   * Raw PCM audio data.
   * - `'float32'`: 4 bytes per sample, values between -1.0 and 1.0
   * - `'int16'`: 2 bytes per sample, little-endian signed integers
   *
   * For multi-channel audio, samples are interleaved: [L, R, L, R, ...].
   */
  data: ArrayBuffer;

  /** Actual sample rate in Hz. May differ from the requested rate. */
  sampleRate: number;

  /** Actual number of channels. */
  channels: number;

  /** Seconds since the stream was started. */
  timestamp: number;
};

export type AudioStreamStatus = {
  isStreaming: boolean;
};

export type AudioStreamEvents = {
  audioStreamBuffer(buffer: AudioStreamBuffer): void;
  audioStreamStatus(status: AudioStreamStatus): void;
};

export type AudioStreamResult = {
  stream: AudioStream;
  isStreaming: boolean;
};

export type AudioStreamFileRecordingOptions = {
  /**
   * Absolute file URI to write to. If omitted, a file is auto-generated in `directory`.
   */
  uri?: string;
  /**
   * Directory for the auto-generated file. Ignored when `uri` is provided.
   * @default 'cache'
   */
  directory?: RecordingDirectory;
  /**
   * Container format for the written file.
   * - `'wav'`: PCM wrapped in a WAV container (header kept valid during recording).
   * - `'pcm'`: raw headerless PCM matching the stream's `encoding`/`sampleRate`/`channels`.
   * @default 'wav'
   */
  format?: 'wav' | 'pcm';
};

export type AudioStreamFileRecordingResult = {
  /** URI of the finalised file (a Blob URL on web). */
  uri: string;
  /** Seconds of audio recorded. */
  duration: number;
  /**
   * Total bytes written.
   * For `'wav'` format this includes the 44-byte header; for `'pcm'` it is PCM bytes only.
   */
  size: number;
  /** Sample rate of the recorded audio in Hz. */
  sampleRate: number;
  /** Number of channels in the recorded audio. */
  channels: number;
  /** PCM sample encoding of the recorded audio. */
  encoding: AudioStreamEncoding;
};

/**
 * A native audio stream that captures PCM audio from the microphone in real-time.
 */
export declare class AudioStream extends SharedObject<AudioStreamEvents> {
  /** @hidden */
  constructor(options: { sampleRate: number; channels: number; encoding: string });

  id: string;

  /** Actual sample rate being delivered, in Hz. Available after `start()`. */
  readonly sampleRate: number;

  /** Actual number of channels being delivered. Available after `start()`. */
  readonly channels: number;

  readonly isStreaming: boolean;

  /**
   * Begins capturing audio from the microphone.
   * Requires microphone permission — call `requestRecordingPermissionsAsync()` first.
   */
  start(): Promise<void>;

  /**
   * Stops capturing and releases native audio resources.
   * If a file recording is in progress, it is automatically finalized before resources are released.
   */
  stop(): void;

  /**
   * Begins writing captured audio to a file alongside live buffer delivery.
   * The file is created immediately and is a valid, playable file from the moment this resolves.
   *
   * The stream must be actively running when this is called — call `start()` first.
   * Only one file recording can be active at a time; throws if one is already in progress.
   *
   * If `stop()` is called while a file recording is in progress, the recording is
   * automatically finalized and the file remains accessible at the URI returned here.
   * @param options Configuration for the output file. When omitted, a WAV file is
   * auto-generated in the app's cache directory.
   * @throws If the stream is not currently running, or if a file recording is already in progress.
   * @platform android
   * @platform ios
   */
  startFileRecordingAsync(options?: AudioStreamFileRecordingOptions): Promise<{ uri: string }>;

  /**
   * Finalizes the current file recording and returns metadata of the recorded file.
   * Throws if no file recording is in progress.
   * @platform android
   * @platform ios
   */
  stopFileRecordingAsync(): Promise<AudioStreamFileRecordingResult>;
}
