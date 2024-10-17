export declare enum BackgroundTaskStatus {
    /**
     * Background updates are unavailable.
     */
    Restricted = 1,
    /**
     * Background updates are available for the app.
     */
    Available = 2
}
/**
 * Type of background task.
 */
export declare enum BackgroundTaskType {
    /**
     * Task will be executed periodically.
     */
    Periodic = 1,
    /**
     * Task will be executed only once.
     */
    OneTime = 2
}
/**
 * Options for scheduling a background task.
 */
export interface BackgroundTaskOptions {
    /**
     * Type of background task
     */
    type: BackgroundTaskType;
    /**
     * Interval in minutes - only for periodic tasks.
     * Minimum interval is 15 minutes.
     */
    intervalMinutes?: number;
}
/**
 * Defines the callback type for a background task.
 */
export type BackgroundTaskExecutor = () => Promise<void>;
/**
 * Defines the different statuses for a background task log item
 */
export declare enum BackgroundTaskInfoStatus {
    /**
     * The task has been enqueued and is waiting to run
     */
    Enqueued = 1,
    /**
     * The task has been successfully executed
     */
    Success = 2,
    /**
     * The task has failed
     */
    Failed = 3,
    /**
     * Task was cancelled
     */
    Cancelled = 4,
    /**
     * Task was stopped after running as a one-time task
     */
    Stopped = 5
}
/**
 * Defines the serialized information about a background task run.
 */
export type BackgroundTaskLogEntry = {
    /**
     * Task identifier
     */
    identifier: string;
    /**
     * The date and time when the task was started
     */
    date: number;
    /**
     * Number of milliseconds the task took to run
     */
    duration: number;
    /**
     * The status of the task after it was run
     */
    status: BackgroundTaskInfoStatus;
    /**
     * Serialized error message if the task failed
     */
    error?: string;
};
/**
 * Defines the serialized information about a background task.
 */
export type BackgroundTaskInfo = {
    /**
     * Identifier of the task
     */
    taskIdentifier: string;
    /**
     * Task type - periodic or one-time
     */
    type: BackgroundTaskType;
    /**
     * Interval in minutes - only for periodic tasks.
     * Minimum interval is 15 minutes.
     */
    intervalMinutes: number;
};
//# sourceMappingURL=BackgroundTask.types.d.ts.map