/**
 * The types of update-related events.
 */
export var UpdateEventType;
(function (UpdateEventType) {
    /**
     * A new update has finished downloading to local storage. If you would like to start using this
     * update at any point before the user closes and restarts the app on their own, you can call
     * [`Updates.reloadAsync()`](#reloadasync) to launch this new update.
     */
    UpdateEventType["UPDATE_AVAILABLE"] = "updateAvailable";
    /**
     * No updates are available, and the most up-to-date update is already running.
     */
    UpdateEventType["NO_UPDATE_AVAILABLE"] = "noUpdateAvailable";
    /**
     * An error occurred trying to fetch the latest update.
     */
    UpdateEventType["ERROR"] = "error";
})(UpdateEventType || (UpdateEventType = {}));
//# sourceMappingURL=Updates.types.js.map