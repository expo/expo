/**
 * Availability status for background tasks
 */
export declare enum BackgroundTaskStatus {
    /**
     * Background tasks are unavailable.
     */
    Restricted = 1,
    /**
     * Background tasks are available for the app.
     */
    Available = 2
}
/**
 * Return value for background tasks.
 */
export declare enum BackgroundTaskResult {
    /**
     * The task finished successfully.
     */
    Success = 1,
    /**
     * The task failed.
     */
    Failed = 2
}
/**
 * Options for registering a background task
 */
export type BackgroundTaskOptions = {
    /**
     * Inexact interval in minutes between subsequent repeats of the background tasks. The final
     * interval may differ from the specified one to minimize wakeups and battery usage.
     * - Defaults to once every 12 hours (The minimum interval is 15 minutes)
     * - The system controls the background task execution interval and treats the
     * specified value as a minimum delay. Tasks won't run exactly on schedule. On iOS, short
     * intervals are often ignored—the system typically runs background tasks during
     * specific windows, such as overnight.
     *
     */
    minimumInterval?: number;
};
//# sourceMappingURL=BackgroundTask.types.d.ts.map