/**
 * State of a background location task.
 *
 * @platform android
 */
export type BackgroundTaskStatus = {
  /** Whether the task is registered with the system. */
  isRegistered: boolean;
  /** Whether the provider accepted the request for updates. */
  isRunning: boolean;
  /** Why the last request for updates failed, or `null` when it succeeded. */
  lastError: string | null;
  /** When the last position arrived, in milliseconds, or `null` when none has. */
  lastFixAt: number | null;
};
