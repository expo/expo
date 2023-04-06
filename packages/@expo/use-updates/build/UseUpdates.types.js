/**
 * The types of update-related events.
 */
export var UseUpdatesEventType;
(function (UseUpdatesEventType) {
    /**
     * A new update is available for the app. This event can be fired either from
     * the native code that automatically checks for an update on startup (when automatic updates
     * are enabled), or from the completion of checkForUpdate().
     */
    UseUpdatesEventType["UPDATE_AVAILABLE"] = "updateAvailable";
    /**
     * No new update is available for the app, and the most up-to-date update is already running.
     * This event can be fired either from
     * the native code that automatically checks for an update on startup (when automatic updates
     * are enabled), or from the completion of checkForUpdate().
     */
    UseUpdatesEventType["NO_UPDATE_AVAILABLE"] = "noUpdateAvailable";
    /**
     * An error occurred.
     */
    UseUpdatesEventType["ERROR"] = "error";
    /**
     * A call to `downloadUpdate()` has started.
     */
    UseUpdatesEventType["DOWNLOAD_START"] = "downloadStart";
    /**
     * A call to `downloadUpdate()` has completed successfully.
     */
    UseUpdatesEventType["DOWNLOAD_COMPLETE"] = "downloadComplete";
    /**
     * A call to `readLogEntries()` has completed successfully.
     */
    UseUpdatesEventType["READ_LOG_ENTRIES_COMPLETE"] = "readLogEntriesComplete";
})(UseUpdatesEventType || (UseUpdatesEventType = {}));
//# sourceMappingURL=UseUpdates.types.js.map