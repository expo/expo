/**
 * Availability status for background tasks
 */
export declare enum BackgroundTaskStatus {
    /**
     * Background updates are unavailable
     */
    Restricted = 1,
    /**
     * Background updates are available for the app
     */
    Available = 2
}
/**
 * Return value for background tasks
 */
export declare enum BackgroundTaskResult {
    /**
     * The task finished successfully
     */
    Success = 1,
    /**
     * The task failed
     */
    Failed = 2
}
/**
 * Options for registering a background task
 */
export interface BackgroundTaskOptions {
    /**
     * Inexact interval in seconds between subsequent repeats of the background tasks. The final
     * interval may differ from the specified one to minimize wakeups and battery usage.
     * - Defaults to __15 minutes__ on Android.
     * - The minimum internval is 15 minutes.
     * - On iOS there is no way to set the interval. The system will determine the interval.
     * @platform android
     */
    minimumInterval?: number;
}
//# sourceMappingURL=BackgroundTask.types.d.ts.map