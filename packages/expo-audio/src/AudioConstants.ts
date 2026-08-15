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
};
