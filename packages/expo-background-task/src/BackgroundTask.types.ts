// @needsAudit
/**
 * Availability status for background tasks
 */
export enum BackgroundTaskStatus {
  /**
   * Background tasks are unavailable.
   */
  Restricted = 1,
  /**
   * Background tasks are available for the app.
   */
  Available = 2,
}

// @needsAudit
/**
 * Return value for background tasks.
 */
export enum BackgroundTaskResult {
  /**
   * The task finished successfully.
   */
  Success = 1,
  /**
   * The task failed.
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
   * - Defaults to once every 12 hours (The minimum interval is 15 minutes)
   * - On iOS, the system determines the interval for background task execution,
   *  but will wait until the specified minimum interval has elapsed before starting a task.
   * @platform android
   */
  minimumInterval?: number;
};
