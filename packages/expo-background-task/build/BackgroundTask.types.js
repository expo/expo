// @needsAudit
/**
 * Availability status for background tasks
 */
export var BackgroundTaskStatus;
(function (BackgroundTaskStatus) {
    /**
     * Background tasks are unavailable.
     */
    BackgroundTaskStatus[BackgroundTaskStatus["Restricted"] = 1] = "Restricted";
    /**
     * Background tasks are available for the app.
     */
    BackgroundTaskStatus[BackgroundTaskStatus["Available"] = 2] = "Available";
})(BackgroundTaskStatus || (BackgroundTaskStatus = {}));
// @needsAudit
/**
 * Return value for background tasks.
 */
export var BackgroundTaskResult;
(function (BackgroundTaskResult) {
    /**
     * The task finished successfully.
     */
    BackgroundTaskResult[BackgroundTaskResult["Success"] = 1] = "Success";
    /**
     * The task failed.
     */
    BackgroundTaskResult[BackgroundTaskResult["Failed"] = 2] = "Failed";
})(BackgroundTaskResult || (BackgroundTaskResult = {}));
//# sourceMappingURL=BackgroundTask.types.js.map