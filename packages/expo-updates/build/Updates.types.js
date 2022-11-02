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
/**
 * The possible code values for expo-updates log entries
 */
export var UpdatesLogEntryCode;
(function (UpdatesLogEntryCode) {
    UpdatesLogEntryCode["NONE"] = "None";
    UpdatesLogEntryCode["NO_UPDATES_AVAILABLE"] = "NoUpdatesAvailable";
    UpdatesLogEntryCode["UPDATE_ASSETS_NOT_AVAILABLE"] = "UpdateAssetsNotAvailable";
    UpdatesLogEntryCode["UPDATE_SERVER_UNREACHABLE"] = "UpdateServerUnreachable";
    UpdatesLogEntryCode["UPDATE_HAS_INVALID_SIGNATURE"] = "UpdateHasInvalidSignature";
    UpdatesLogEntryCode["UPDATE_CODE_SIGNING_ERROR"] = "UpdateCodeSigningError";
    UpdatesLogEntryCode["UPDATE_FAILED_TO_LOAD"] = "UpdateFailedToLoad";
    UpdatesLogEntryCode["ASSETS_FAILED_TO_LOAD"] = "AssetsFailedToLoad";
    UpdatesLogEntryCode["JS_RUNTIME_ERROR"] = "JSRuntimeError";
    UpdatesLogEntryCode["UNKNOWN"] = "Unknown";
})(UpdatesLogEntryCode || (UpdatesLogEntryCode = {}));
/**
 * The possible log levels for expo-updates log entries
 */
export var UpdatesLogEntryLevel;
(function (UpdatesLogEntryLevel) {
    UpdatesLogEntryLevel["TRACE"] = "trace";
    UpdatesLogEntryLevel["DEBUG"] = "debug";
    UpdatesLogEntryLevel["INFO"] = "info";
    UpdatesLogEntryLevel["WARN"] = "warn";
    UpdatesLogEntryLevel["ERROR"] = "error";
    UpdatesLogEntryLevel["FATAL"] = "fatal";
})(UpdatesLogEntryLevel || (UpdatesLogEntryLevel = {}));
//# sourceMappingURL=Updates.types.js.map