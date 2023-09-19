/**
 * A class that represents an instance of the video player.
 */
export declare class VideoPlayer {
  /**
   * Boolean value whether the player is currently playing.
   */
  isPlaying: boolean;

  /**
   * Boolean value whether the player is currently muted.
   */
  isMuted: boolean;

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
  replace(source: string): void;

  /**
   * Seeks the playback by the given number of seconds.
   */
  seekBy(seconds: number): void;

  /**
   * Seeks the playback to the beginning.
   */
  replay(): void;
}
