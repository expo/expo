// @needsAudit
/**
 * Options for configuring which playback controls should be displayed on the lock screen.
 */
export type AudioLockScreenOptions = {
  /**
   * Whether the seek forward button should be displayed on the lock screen.
   */
  showSeekForward?: boolean;
  /**
   * Whether the seek backward button should be displayed on the lock screen.
   */
  showSeekBackward?: boolean;
  /**
   * Whether the next track button should be displayed on the lock screen.
   */
  showNextTrack?: boolean;
  /**
   * Whether the previous track button should be displayed on the lock screen.
   */
  showPreviousTrack?: boolean;
  /**
   * Whether the audio is a live stream. When `true`, the lock screen will hide the duration
   * and scrub bar, and disable seek controls.
   */
  isLiveStream?: boolean;
  /**
   * How far, in seconds, the lock screen seek forward button jumps ahead.
   * Values below `0.1` are clamped up to `0.1` so that the button always moves playback.
   *
   * On Android, the whole-second values `5`, `10`, `15`, and `30` render a matching numbered skip
   * icon, and every other value renders a generic skip icon. On iOS, the number is drawn into the
   * glyph for any value, because it is passed through as the skip command's preferred interval.
   * On web, the browser decides which control it shows and which offset it sends, so this value is
   * only used as a fallback when the browser omits an offset of its own.
   * @default 10
   */
  seekForwardIntervalSeconds?: number;
  /**
   * How far, in seconds, the lock screen seek backward button jumps back.
   * Values below `0.1` are clamped up to `0.1` so that the button always moves playback.
   *
   * On Android, the whole-second values `5`, `10`, `15`, and `30` render a matching numbered skip
   * icon, and every other value renders a generic skip icon. On iOS, the number is drawn into the
   * glyph for any value, because it is passed through as the skip command's preferred interval.
   * On web, the browser decides which control it shows and which offset it sends, so this value is
   * only used as a fallback when the browser omits an offset of its own.
   * @default 10
   */
  seekBackwardIntervalSeconds?: number;
};
