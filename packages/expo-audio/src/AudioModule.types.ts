import { NativeModule } from 'react-native';

import { AudioSource } from './Audio.types';

export type StatusEvent = {
  id: number;
  currentPosition: number;
  status: string;
  timeControlStatus: string;
  reasonForWaitingToPlay: string;
  isMuted: boolean;
  duration: number;
  isPlaying: boolean;
  isLooping: boolean;
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
  duration: number;

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
   */
  seekTo(seconds: number): Promise<void>;
}
