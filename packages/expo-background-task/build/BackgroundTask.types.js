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
//# sourceMappingURL=BackgroundTask.types.js.map