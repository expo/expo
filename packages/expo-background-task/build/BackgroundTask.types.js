"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundTaskResult = exports.BackgroundTaskStatus = void 0;
// @needsAudit
/**
 * Availability status for background tasks
 */
var BackgroundTaskStatus;
(function (BackgroundTaskStatus) {
    /**
     * Background tasks are unavailable.
     */
    BackgroundTaskStatus[BackgroundTaskStatus["Restricted"] = 1] = "Restricted";
    /**
     * Background tasks are available for the app.
     */
    BackgroundTaskStatus[BackgroundTaskStatus["Available"] = 2] = "Available";
})(BackgroundTaskStatus || (exports.BackgroundTaskStatus = BackgroundTaskStatus = {}));
// @needsAudit
/**
 * Return value for background tasks.
 */
var BackgroundTaskResult;
(function (BackgroundTaskResult) {
    /**
     * The task finished successfully.
     */
    BackgroundTaskResult[BackgroundTaskResult["Success"] = 1] = "Success";
    /**
     * The task failed.
     */
    BackgroundTaskResult[BackgroundTaskResult["Failed"] = 2] = "Failed";
})(BackgroundTaskResult || (exports.BackgroundTaskResult = BackgroundTaskResult = {}));
