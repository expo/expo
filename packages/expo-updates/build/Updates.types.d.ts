import { ExpoUpdatesManifest, EmbeddedManifest } from 'expo-manifests';
export type Manifest = ExpoUpdatesManifest | EmbeddedManifest;
export declare enum UpdateCheckResultNotAvailableReason {
    /**
     * No update manifest or rollback directive received from the update server.
     */
    NO_UPDATE_AVAILABLE_ON_SERVER = "noUpdateAvailableOnServer",
    /**
     * An update manifest was received from the update server, but the update is not launchable,
     * or does not pass the configured selection policy.
     */
    UPDATE_REJECTED_BY_SELECTION_POLICY = "updateRejectedBySelectionPolicy",
    /**
     * An update manifest was received from the update server, but the update has been previously
     * launched on this device and never successfully launched.
     */
    UPDATE_PREVIOUSLY_FAILED = "updatePreviouslyFailed",
    /**
     * A rollback directive was received from the update server, but the directive does not pass
     * the configured selection policy.
     */
    ROLLBACK_REJECTED_BY_SELECTION_POLICY = "rollbackRejectedBySelectionPolicy",
    /**
     * A rollback directive was received from the update server, but this app has no embedded update.
     */
    ROLLBACK_NO_EMBEDDED = "rollbackNoEmbeddedConfiguration"
}
/**
 * The update check result when a rollback directive is received.
 */
export type UpdateCheckResultRollBack = {
    /**
     * Whether an update is available. This property is false for a roll back update.
     */
    isAvailable: false;
    /**
     * The manifest of the update when available.
     */
    manifest: undefined;
    /**
     * Whether a roll back to embedded update is available.
     */
    isRollBackToEmbedded: true;
    /**
     * If no new update is found, this contains one of several enum values indicating the reason.
     */
    reason: undefined;
};
/**
 * The update check result when a new update is found on the server.
 */
export type UpdateCheckResultAvailable = {
    /**
     * Whether an update is available. This property is false for a roll back update.
     */
    isAvailable: true;
    /**
     * The manifest of the update when available.
     */
    manifest: Manifest;
    /**
     * Whether a roll back to embedded update is available.
     */
    isRollBackToEmbedded: false;
    /**
     * If no new update is found, this contains one of several enum values indicating the reason.
     */
    reason: undefined;
};
/**
 * The update check result if no new update was found.
 */
export type UpdateCheckResultNotAvailable = {
    /**
     * Whether an update is available. This property is false for a roll back update.
     */
    isAvailable: false;
    /**
     * The manifest of the update when available.
     */
    manifest: undefined;
    /**
     * Whether a roll back to embedded update is available.
     */
    isRollBackToEmbedded: false;
    /**
     * If no new update is found, this contains one of several enum values indicating the reason.
     */
    reason: UpdateCheckResultNotAvailableReason;
};
/**
 * The result of checking for a new update.
 */
export type UpdateCheckResult = UpdateCheckResultRollBack | UpdateCheckResultAvailable | UpdateCheckResultNotAvailable;
/**
 * The successful result of fetching a new update.
 */
export type UpdateFetchResultSuccess = {
    /**
     * Whether the fetched update is new (that is, a different version than what's currently running).
     * Always `true` when `isRollBackToEmbedded` is `false`.
     */
    isNew: true;
    /**
     * The manifest of the fetched update.
     */
    manifest: Manifest;
    /**
     * Whether the fetched update is a roll back to the embedded update.
     */
    isRollBackToEmbedded: false;
};
/**
 * The failed result of fetching a new update.
 */
export type UpdateFetchResultFailure = {
    /**
     * Whether the fetched update is new (that is, a different version than what's currently running).
     * Always `false` when `isRollBackToEmbedded` is `true`.
     */
    isNew: false;
    /**
     * The manifest of the fetched update.
     */
    manifest: undefined;
    /**
     * Whether the fetched update is a roll back to the embedded update.
     */
    isRollBackToEmbedded: false;
};
/**
 * The roll back to embedded result of fetching a new update.
 */
export type UpdateFetchResultRollBackToEmbedded = {
    /**
     * Whether the fetched update is new (that is, a different version than what's currently running).
     * Always `false` when `isRollBackToEmbedded` is `true`.
     */
    isNew: false;
    /**
     * The manifest of the fetched update.
     */
    manifest: undefined;
    /**
     * Whether the fetched update is a roll back to the embedded update.
     */
    isRollBackToEmbedded: true;
};
/**
 * The result of fetching a new update.
 */
export type UpdateFetchResult = UpdateFetchResultSuccess | UpdateFetchResultFailure | UpdateFetchResultRollBackToEmbedded;
/**
 * An object representing a single log entry from `expo-updates` logging on the client.
 */
export type UpdatesLogEntry = {
    /**
     * The time the log was written, in milliseconds since Jan 1 1970 UTC.
     */
    timestamp: number;
    /**
     * The log entry message.
     */
    message: string;
    /**
     * One of the defined code values for `expo-updates` log entries.
     */
    code: UpdatesLogEntryCode;
    /**
     * One of the defined log level or severity values.
     */
    level: UpdatesLogEntryLevel;
    /**
     * If present, the unique ID of an update associated with this log entry.
     */
    updateId?: string;
    /**
     * If present, the unique ID or hash of an asset associated with this log entry.
     */
    assetId?: string;
    /**
     * If present, an Android or iOS native stack trace associated with this log entry.
     */
    stacktrace?: string[];
};
/**
 * The possible code values for `expo-updates` log entries
 */
export declare enum UpdatesLogEntryCode {
    NONE = "None",
    NO_UPDATES_AVAILABLE = "NoUpdatesAvailable",
    UPDATE_ASSETS_NOT_AVAILABLE = "UpdateAssetsNotAvailable",
    UPDATE_SERVER_UNREACHABLE = "UpdateServerUnreachable",
    UPDATE_HAS_INVALID_SIGNATURE = "UpdateHasInvalidSignature",
    UPDATE_CODE_SIGNING_ERROR = "UpdateCodeSigningError",
    UPDATE_FAILED_TO_LOAD = "UpdateFailedToLoad",
    ASSETS_FAILED_TO_LOAD = "AssetsFailedToLoad",
    JS_RUNTIME_ERROR = "JSRuntimeError",
    INITIALIZATION_ERROR = "InitializationError",
    UNKNOWN = "Unknown"
}
/**
 * The possible log levels for `expo-updates` log entries
 */
export declare enum UpdatesLogEntryLevel {
    TRACE = "trace",
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal"
}
/**
 * The possible settings that determine if `expo-updates` will check for updates on app startup.
 * By default, Expo will check for updates every time the app is loaded.
 * Set this to `ON_ERROR_RECOVERY` to disable automatic checking unless recovering from an error.
 * Set this to `NEVER` to completely disable automatic checking.
 */
export declare enum UpdatesCheckAutomaticallyValue {
    /**
     * Checks for updates whenever the app is loaded. This is the default setting.
     */
    ON_LOAD = "ON_LOAD",
    /**
     * Only checks for updates when the app starts up after an error recovery.
     */
    ON_ERROR_RECOVERY = "ON_ERROR_RECOVERY",
    /**
     * Only checks for updates when the app starts and has a Wi-Fi connection.
     */
    WIFI_ONLY = "WIFI_ONLY",
    /**
     * Automatic update checks are off, and update checks must be done through the JS API.
     */
    NEVER = "NEVER"
}
/**
 * @hidden
 */
export type LocalAssets = Record<string, string>;
export type { ReloadScreenOptions, ReloadScreenImageSource } from './ReloadScreen.types';
/**
 * @hidden
 */
export type UpdatesNativeStateRollback = {
    commitTime: string;
};
/**
 * The native state machine context, either read directly from a native module method,
 * or received in a state change event. Used internally by this module and not exported publicly.
 * @hidden
 */
export type UpdatesNativeStateMachineContext = {
    isStartupProcedureRunning: boolean;
    isUpdateAvailable: boolean;
    isUpdatePending: boolean;
    isChecking: boolean;
    isDownloading: boolean;
    isRestarting: boolean;
    restartCount: number;
    latestManifest?: Manifest;
    downloadedManifest?: Manifest;
    rollback?: UpdatesNativeStateRollback;
    checkError?: Error;
    downloadError?: Error;
    lastCheckForUpdateTime?: Date;
    sequenceNumber: number;
    downloadProgress: number;
};
/**
 * @hidden
 */
export type UpdatesNativeStateChangeEvent = {
    context: UpdatesNativeStateMachineContext;
};
//# sourceMappingURL=Updates.types.d.ts.map