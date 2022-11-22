import Constants from 'expo-constants';
/**
 * The types of update-related events.
 */
export declare enum UpdateEventType {
    /**
     * A new update has finished downloading to local storage. If you would like to start using this
     * update at any point before the user closes and restarts the app on their own, you can call
     * [`Updates.reloadAsync()`](#reloadasync) to launch this new update.
     */
    UPDATE_AVAILABLE = "updateAvailable",
    /**
     * No updates are available, and the most up-to-date update is already running.
     */
    NO_UPDATE_AVAILABLE = "noUpdateAvailable",
    /**
     * An error occurred trying to fetch the latest update.
     */
    ERROR = "error"
}
/**
 * @hidden
 */
export declare type ClassicManifest = typeof Constants.manifest;
/**
 * @hidden
 */
export declare type Manifest = ClassicManifest | typeof Constants.manifest2;
/**
 * The successful result of checking for a new update.
 */
declare type UpdateCheckResultSuccess = {
    /**
     * Signifies that an update is available.
     */
    isAvailable: true;
    /**
     * The manifest of the available update.
     */
    manifest: Manifest;
};
/**
 * The failed result of checking for a new update.
 */
declare type UpdateCheckResultFailure = {
    /**
     * Signifies that the app is already running the latest available update.
     */
    isAvailable: false;
    /**
     * No manifest, since the app is already running the latest available version.
     */
    manifest: undefined;
};
/**
 * The result of checking for a new update.
 */
export declare type UpdateCheckResult = UpdateCheckResultSuccess | UpdateCheckResultFailure;
/**
 * The successful result of fetching a new update.
 */
declare type UpdateFetchResultSuccess = {
    /**
     * Signifies that the fetched bundle is new (that is, a different version than what's currently
     * running).
     */
    isNew: true;
    /**
     * The manifest of the newly downloaded update.
     */
    manifest: Manifest;
};
/**
 * The failed result of fetching a new update.
 */
declare type UpdateFetchResultFailure = {
    /**
     * Signifies that the fetched bundle is the same as version which is currently running.
     */
    isNew: false;
    /**
     * No manifest, since there is no update.
     */
    manifest: undefined;
};
/**
 * The result of fetching a new update.
 */
export declare type UpdateFetchResult = UpdateFetchResultSuccess | UpdateFetchResultFailure;
/**
 * An object that is passed into each event listener when an auto-update check occurs.
 */
export declare type UpdateEvent = {
    /**
     * Type of the event.
     */
    type: UpdateEventType;
    /**
     * If `type` is `Updates.UpdateEventType.UPDATE_AVAILABLE`, the manifest of the newly downloaded
     * update, and `undefined` otherwise.
     */
    manifest?: Manifest;
    /**
     * If `type` is `Updates.UpdateEventType.ERROR`, the error message, and `undefined` otherwise.
     */
    message?: string;
};
/**
 * An object representing a single log entry from expo-updates logging on the client.
 */
export declare type UpdatesLogEntry = {
    /**
     * The time the log was written, in milliseconds since Jan 1 1970 UTC.
     */
    timestamp: number;
    /**
     * The log entry message.
     */
    message: string;
    /**
     * One of the defined code values for expo-updates log entries.
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
     * If present, an iOS or Android native stack trace associated with this log entry.
     */
    stacktrace?: string[];
};
/**
 * The possible code values for expo-updates log entries
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
    UNKNOWN = "Unknown"
}
/**
 * The possible log levels for expo-updates log entries
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
 * @hidden
 */
export declare type LocalAssets = Record<string, string>;
export {};
//# sourceMappingURL=Updates.types.d.ts.map