// @needsAudit
/**
 * Availability status for background tasks
 */
export enum BackgroundTaskStatus {
  /**
   * Background updates are unavailable
   */
  Restricted = 1,
  /**
   * Background updates are available for the app
   */
  Available = 2,
}

// @needsAudit
/**
 * Return value for background tasks
 */
export enum BackgroundTaskResult {
  /**
   * The task finished successfully
   */
  Success = 1,
  /**
   * The task failed
   */
  Failed = 2,
}

// @needsAudit
/**
 * Options for registering a background task
 */
export type BackgroundTaskOptions = {
  /**
   * Inexact interval in minutes between subsequent repeats of the background tasks. The final
   * interval may differ from the specified one to minimize wakeups and battery usage.
   * - Defaults to once every day on Android (The minimum interval is 15 minutes)
   * - On iOS the system will determine the interval.
   * @platform android
   */
  minimumInterval?: number;
};
