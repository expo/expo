export var UpdateCheckResultNotAvailableReason;
(function (UpdateCheckResultNotAvailableReason) {
    /**
     * No update manifest or rollback directive received from the update server.
     */
    UpdateCheckResultNotAvailableReason["NO_UPDATE_AVAILABLE_ON_SERVER"] = "noUpdateAvailableOnServer";
    /**
     * An update manifest was received from the update server, but the update is not launchable,
     * or does not pass the configured selection policy.
     */
    UpdateCheckResultNotAvailableReason["UPDATE_REJECTED_BY_SELECTION_POLICY"] = "updateRejectedBySelectionPolicy";
    /**
     * An update manifest was received from the update server, but the update has been previously
     * launched on this device and never successfully launched.
     */
    UpdateCheckResultNotAvailableReason["UPDATE_PREVIOUSLY_FAILED"] = "updatePreviouslyFailed";
    /**
     * A rollback directive was received from the update server, but the directive does not pass
     * the configured selection policy.
     */
    UpdateCheckResultNotAvailableReason["ROLLBACK_REJECTED_BY_SELECTION_POLICY"] = "rollbackRejectedBySelectionPolicy";
    /**
     * A rollback directive was received from the update server, but this app has no embedded update.
     */
    UpdateCheckResultNotAvailableReason["ROLLBACK_NO_EMBEDDED"] = "rollbackNoEmbeddedConfiguration";
})(UpdateCheckResultNotAvailableReason || (UpdateCheckResultNotAvailableReason = {}));
/**
 * The possible code values for `expo-updates` log entries
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
    UpdatesLogEntryCode["INITIALIZATION_ERROR"] = "InitializationError";
    UpdatesLogEntryCode["UNKNOWN"] = "Unknown";
})(UpdatesLogEntryCode || (UpdatesLogEntryCode = {}));
/**
 * The possible log levels for `expo-updates` log entries
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
/**
 * The possible settings that determine if `expo-updates` will check for updates on app startup.
 * By default, Expo will check for updates every time the app is loaded.
 * Set this to `ON_ERROR_RECOVERY` to disable automatic checking unless recovering from an error.
 * Set this to `NEVER` to completely disable automatic checking.
 */
export var UpdatesCheckAutomaticallyValue;
(function (UpdatesCheckAutomaticallyValue) {
    /**
     * Checks for updates whenever the app is loaded. This is the default setting.
     */
    UpdatesCheckAutomaticallyValue["ON_LOAD"] = "ON_LOAD";
    /**
     * Only checks for updates when the app starts up after an error recovery.
     */
    UpdatesCheckAutomaticallyValue["ON_ERROR_RECOVERY"] = "ON_ERROR_RECOVERY";
    /**
     * Only checks for updates when the app starts and has a Wi-Fi connection.
     */
    UpdatesCheckAutomaticallyValue["WIFI_ONLY"] = "WIFI_ONLY";
    /**
     * Automatic update checks are off, and update checks must be done through the JS API.
     */
    UpdatesCheckAutomaticallyValue["NEVER"] = "NEVER";
})(UpdatesCheckAutomaticallyValue || (UpdatesCheckAutomaticallyValue = {}));
//# sourceMappingURL=Updates.types.js.map