/**
 * State of a background location task.
 *
 * @platform android
 */
export type BackgroundTaskStatus = {
  /** Whether the task is registered in the system. */
  isRegistered: boolean;
  /** Whether the provider accepted the request for updates. */
  isRunning: boolean;
  /** Why the last request for updates failed, or `null` when no failure was reported. */
  lastError: string | null;
  /**
   * The `timestamp` of the last delivered position, in milliseconds since the Unix epoch, or
   * `null` when none has arrived.
   */
  lastFixAt: number | null;
};
