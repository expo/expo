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
   * Whether the audio is a live stream. When `true`, the lock screen will hide the duration
   * and scrub bar, and disable seek controls.
   */
  isLiveStream?: boolean;
  /**
   * Duration in seconds for the seek forward button on the lock screen.
   * Must be a positive number. Defaults to `10`.
   *
   * On Android, values of `5`, `10`, `15`, or `30` display a matching numbered skip icon.
   * Other values use a generic skip icon.
   */
  seekForwardIntervalSeconds?: number;
  /**
   * Duration in seconds for the seek backward button on the lock screen.
   * Must be a positive number. Defaults to `10`.
   *
   * On Android, values of `5`, `10`, `15`, or `30` display a matching numbered skip icon.
   * Other values use a generic skip icon.
   */
  seekBackwardIntervalSeconds?: number;
};
