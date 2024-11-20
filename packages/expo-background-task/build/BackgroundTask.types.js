// @needsAudit
export var BackgroundTaskStatus;
(function (BackgroundTaskStatus) {
    /**
     * Background updates are unavailable.
     */
    BackgroundTaskStatus[BackgroundTaskStatus["Restricted"] = 1] = "Restricted";
    /**
     * Background updates are available for the app.
     */
    BackgroundTaskStatus[BackgroundTaskStatus["Available"] = 2] = "Available";
})(BackgroundTaskStatus || (BackgroundTaskStatus = {}));
/**
 * Type of background task.
 */
export var BackgroundTaskType;
(function (BackgroundTaskType) {
    /**
     * Task will be executed periodically.
     */
    BackgroundTaskType[BackgroundTaskType["Periodic"] = 1] = "Periodic";
    /**
     * Task will be executed only once.
     */
    BackgroundTaskType[BackgroundTaskType["OneTime"] = 2] = "OneTime";
})(BackgroundTaskType || (BackgroundTaskType = {}));
/**
 * Defines the different statuses for a background task log item
 */
export var BackgroundTaskInfoStatus;
(function (BackgroundTaskInfoStatus) {
    /**
     * The task has been enqueued and is waiting to run
     */
    BackgroundTaskInfoStatus[BackgroundTaskInfoStatus["Enqueued"] = 1] = "Enqueued";
    /**
     * The task has been successfully executed
     */
    BackgroundTaskInfoStatus[BackgroundTaskInfoStatus["Success"] = 2] = "Success";
    /**
     * The task has failed
     */
    BackgroundTaskInfoStatus[BackgroundTaskInfoStatus["Failed"] = 3] = "Failed";
    /**
     * Task was cancelled
     */
    BackgroundTaskInfoStatus[BackgroundTaskInfoStatus["Cancelled"] = 4] = "Cancelled";
    /**
     * Task was stopped after running as a one-time task
     */
    BackgroundTaskInfoStatus[BackgroundTaskInfoStatus["Stopped"] = 5] = "Stopped";
})(BackgroundTaskInfoStatus || (BackgroundTaskInfoStatus = {}));
//# sourceMappingURL=BackgroundTask.types.js.map