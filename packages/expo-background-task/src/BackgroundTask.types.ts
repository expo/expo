// @needsAudit
export enum BackgroundTaskStatus {
  /**
   * Background updates are unavailable.
   */
  Restricted = 1,
  /**
   * Background updates are available for the app.
   */
  Available = 2,
}

export enum BackgroundTaskResult {
  /**
   * The task finished successfully.
   */
  Success = 1,
  /**
   * The task failed.
   */
  Failed = 3,
}
