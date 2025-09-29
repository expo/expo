// @needsAudit
/**
 * An enum whose values control which of the pre-defined buttons are displayed on the lock screen
 */
export enum LockScreenButton {
  /**
   * "Play/Pause" toggle button
   */
  PLAY_PAUSE = 0,
  /**
   * Forward button
   */
  FORWARD = 1,
  /**
   * Backward button
   */
  BACKWARD = 2,
  /**
   * Next track button
   */
  NEXT = 3,
  /**
   * Previous track button
   */
  PREVIOUS = 4,
}

export type AudioLockScreenOptions = {
  /**
   * Whether the playback controls should be displayed on the lock screen
   */
  buttons?: LockScreenButton[];
};
