export type StatusEvent = {
  currentPosition: number;
  status: string;
  timeControlStatus: string;
  reasonForWaitingToPlay: string;
  isMuted: boolean;
  duration: number;
  isPlaying: boolean;
};

export declare class AudioPlayer {
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
