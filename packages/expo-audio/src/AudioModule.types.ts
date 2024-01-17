import { NativeModule } from 'react-native';

import { AudioSource } from './Audio.types';
import { PermissionResponse } from 'expo-modules-core';

export type AudioStatus = {
  id: number;
  currentPosition: number;
  status: string;
  timeControlStatus: string;
  reasonForWaitingToPlay: string;
  isMuted: boolean;
  totalDuration: number;
  isPlaying: boolean;
  isLooping: boolean;
  isLoaded: boolean;
};

export type RecordingStatus = {
  isFinished: boolean;
  hasError: boolean;
  error: string | null;
};

export type AudioCategory =
  | 'ambient'
  | 'multiRoute'
  | 'playAndRecord'
  | 'playback'
  | 'record'
  | 'soloAmbient';

export interface AudioModule extends NativeModule {
  setIsAudioActive(enabled: boolean): void;
  setCategory(category: AudioCategory): void;

  readonly AudioPlayer: AudioPlayer;
}

export interface RecordingModule extends NativeModule {
  requestRecordingPermissionsAsync(): Promise<RecordingPermissionResponse>;
  getRecordingPermissionsAsync(): Promise<RecordingPermissionResponse>;

  readonly AudioRecorder: AudioRecorder;
}

export type RecordingPermissionResponse = PermissionResponse;

export interface AudioPlayer {
  new (source: AudioSource | string | number | null): AudioPlayer;

  id: number;
  /**
   * Boolean value whether the player is currently playing.
   */
  isPlaying: boolean;

  /**
   * Boolean value whether the player is currently muted.
   */
  isMuted: boolean;

  /**
   * Boolean value whether the player is currently looping.
   */
  isLooping: boolean;

  /**
   * Boolean value whether the player is finished loading.
   */
  isLoaded: boolean;

  /**
   * The current position through the audio item, in seconds.
   */
  currentPosition: number;

  /**
   * The total duration of the audio, in seconds.
   */
  totalDuration: number;

  /**
   * The current volume of the audio.
   */
  volume: number;

  /**
   * The current playback rate of the audio.
   */
  rate: number;

  /**
   * Resumes the player.
   */
  play(): void;

  /**
   * Pauses the player.
   */
  pause(): void;

  /**
   * Seeks the playback by the given number of seconds.
   * @param seconds The number of seconds to seek by.
   */
  seekTo(seconds: number): Promise<void>;
}

export interface AudioRecorder {
  new (url: string | null): AudioRecorder;

  /**
   * The current length of the recording, in seconds.
   */
  currentTime: number;

  /**
   * Boolean value indicating whether the recording is in progress.
   */
  isRecording: boolean;

  /**
   * Starts the recording.
   */
  record(): void;

  /**
   * Stop the recording.
   */
  stop(): void;

  /**
   * Starts the recording at the given time.
   * @param seconds The time in seconds to start recording at.
   */
  startRecordingAtTime(seconds: number): void;

  /**
   * Stops the recording once the specified time has elapsed.
   * @param seconds The time in seconds to stop recording at.
   */
  recordForDuration(seconds: number): void;
}
