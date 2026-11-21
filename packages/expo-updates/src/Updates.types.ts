import type { ExpoUpdatesManifest, EmbeddedManifest } from 'expo-manifests';

export type Manifest = ExpoUpdatesManifest | EmbeddedManifest;

export enum UpdateCheckResultNotAvailableReason {
  /**
   * No update manifest or rollback directive received from the update server.
   */
  NO_UPDATE_AVAILABLE_ON_SERVER = 'noUpdateAvailableOnServer',
  /**
   * An update manifest was received from the update server, but the update is not launchable,
   * or does not pass the configured selection policy.
   */
  UPDATE_REJECTED_BY_SELECTION_POLICY = 'updateRejectedBySelectionPolicy',
  /**
   * An update manifest was received from the update server, but the update has been previously
   * launched on this device and never successfully launched.
   */
  UPDATE_PREVIOUSLY_FAILED = 'updatePreviouslyFailed',
  /**
   * A rollback directive was received from the update server, but the directive does not pass
   * the configured selection policy.
   */
  ROLLBACK_REJECTED_BY_SELECTION_POLICY = 'rollbackRejectedBySelectionPolicy',
  /**
   * A rollback directive was received from the update server, but this app has no embedded update.
   */
  ROLLBACK_NO_EMBEDDED = 'rollbackNoEmbeddedConfiguration',
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
export type UpdateCheckResult =
  | UpdateCheckResultRollBack
  | UpdateCheckResultAvailable
  | UpdateCheckResultNotAvailable;

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
export type UpdateFetchResult =
  | UpdateFetchResultSuccess
  | UpdateFetchResultFailure
  | UpdateFetchResultRollBackToEmbedded;

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
  /**
   * The key of the event that a warning or error entry logs. The key stays the same when the text of
   * the message changes, so it can be used to filter or group entries. An entry for a group of assets
   * that failed to load has the `remote.assetsFailed` or `remote.assetsUnreachable` key, also when
   * the assets were loaded at startup.
   */
  key?: UpdatesLogMessageKey;
  /**
   * The values that fill the message template of the key, such as `cause` or `assetKey`.
   */
  values?: Record<string, string>;
};

/**
 * The possible code values for `expo-updates` log entries. Each warning and error key in
 * [`UpdatesLogMessageKey`](#updateslogmessagekey) has one of these codes.
 */
export enum UpdatesLogEntryCode {
  /**
   * The entry has no more specific code. Most warnings about the updates database, files on disk,
   * and the removal of old updates have this code.
   */
  NONE = 'None',
  /**
   * An update check found no new update. No warning or error key has this code.
   */
  NO_UPDATES_AVAILABLE = 'NoUpdatesAvailable',
  /**
   * No warning or error key has this code.
   */
  UPDATE_ASSETS_NOT_AVAILABLE = 'UpdateAssetsNotAvailable',
  /**
   * `expo-updates` could not reach the update server, for example because the device is offline.
   */
  UPDATE_SERVER_UNREACHABLE = 'UpdateServerUnreachable',
  /**
   * No warning or error key has this code.
   */
  UPDATE_HAS_INVALID_SIGNATURE = 'UpdateHasInvalidSignature',
  /**
   * The code signature of an update could not be verified.
   */
  UPDATE_CODE_SIGNING_ERROR = 'UpdateCodeSigningError',
  /**
   * An update check, download, or launch failed for a reason other than a network error.
   */
  UPDATE_FAILED_TO_LOAD = 'UpdateFailedToLoad',
  /**
   * One or more assets of an update could not be downloaded, found, or read.
   */
  ASSETS_FAILED_TO_LOAD = 'AssetsFailedToLoad',
  /**
   * Error recovery handled a JS error, or `expo-updates` could not send its state to JS.
   */
  JS_RUNTIME_ERROR = 'JSRuntimeError',
  /**
   * `expo-updates` is disabled by its configuration, or failed to start.
   */
  INITIALIZATION_ERROR = 'InitializationError',
  /**
   * An error that has no more specific code.
   */
  UNKNOWN = 'Unknown',
}

/**
 * The possible log levels for `expo-updates` log entries
 */
export enum UpdatesLogEntryLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * The key of an `expo-updates` warning or error log entry. A key names one event, and stays the same
 * when the text of its message changes. Each key has a message template, with `{name}` placeholders
 * that the entry's `values` fill, and the code that its entries have.
 */
export enum UpdatesLogMessageKey {
  /**
   * Message: `The expo-updates system is disabled due to an invalid configuration: {cause}`
   *
   * Code: `InitializationError`
   */
  CONFIG_DISABLED_INVALID_CONFIGURATION = 'config.disabledInvalidConfiguration',
  /**
   * Message: `The expo-updates system is explicitly disabled. To enable it, set the enabled setting to true.`
   *
   * Code: `InitializationError`
   */
  CONFIG_DISABLED_EXPLICITLY = 'config.disabledExplicitly',
  /**
   * Message: `The expo-updates system is disabled due to an error during initialization: {cause}`
   *
   * Code: `InitializationError`
   */
  CONTROLLER_INITIALIZATION_FAILED = 'controller.initializationFailed',
  /**
   * Message: `Failed to override the configuration: {reason}`
   *
   * Code: `None`
   */
  CONFIG_OVERRIDE_INVALID = 'config.overrideInvalid',
  /**
   * Message: `Failed to check for update: {cause}`
   *
   * Code: `UpdateFailedToLoad`
   */
  REMOTE_CHECK_FAILED = 'remote.checkFailed',
  /**
   * Message: `Could not reach the update server to check for an update: {cause}`
   *
   * Code: `UpdateServerUnreachable`
   */
  REMOTE_CHECK_UNREACHABLE = 'remote.checkUnreachable',
  /**
   * Message: `Failed to download new update: {cause}`
   *
   * Code: `UpdateFailedToLoad`
   */
  REMOTE_FETCH_FAILED = 'remote.fetchFailed',
  /**
   * Message: `Could not reach the update server to download a new update: {cause}`
   *
   * Code: `UpdateServerUnreachable`
   */
  REMOTE_FETCH_UNREACHABLE = 'remote.fetchUnreachable',
  /**
   * Message: `Failed to load {count} asset(s) ({assetKeys}): {cause}`
   *
   * Code: `AssetsFailedToLoad`
   */
  REMOTE_ASSETS_FAILED = 'remote.assetsFailed',
  /**
   * Message: `Could not reach the update server to load {count} asset(s) ({assetKeys}): {cause}`
   *
   * Code: `UpdateServerUnreachable`
   */
  REMOTE_ASSETS_UNREACHABLE = 'remote.assetsUnreachable',
  /**
   * Message: `Failed to download asset {assetKey}: {cause}`
   *
   * Code: `AssetsFailedToLoad`
   */
  REMOTE_ASSET_DOWNLOAD_FAILED = 'remote.assetDownloadFailed',
  /**
   * Message: `Could not reach the update server to download asset {assetKey}: {cause}`
   *
   * Code: `UpdateServerUnreachable`
   */
  REMOTE_ASSET_DOWNLOAD_UNREACHABLE = 'remote.assetDownloadUnreachable',
  /**
   * Message: `Could not apply a patch for asset {assetKey} ({reason}); retrying with a full download`
   *
   * Code: `AssetsFailedToLoad`
   */
  REMOTE_PATCH_FALLBACK = 'remote.patchFallback',
  /**
   * Message: `Could not build the Expo-Extra-Params header; the request is sent without it: {cause}`
   *
   * Code: `None`
   */
  REMOTE_EXTRA_PARAMS_HEADER_INVALID = 'remote.extraParamsHeaderInvalid',
  /**
   * Message: `Failed to load remote update: {cause}`
   *
   * Code: `UpdateFailedToLoad`
   */
  STARTUP_REMOTE_LOAD_FAILED = 'startup.remoteLoadFailed',
  /**
   * Message: `Could not reach the update server to load a remote update: {cause}`
   *
   * Code: `UpdateServerUnreachable`
   */
  STARTUP_REMOTE_LOAD_UNREACHABLE = 'startup.remoteLoadUnreachable',
  /**
   * Message: `Failed to load remote update for error recovery: {cause}`
   *
   * Code: `UpdateFailedToLoad`
   */
  STARTUP_ERROR_RECOVERY_LOAD_FAILED = 'startup.errorRecoveryLoadFailed',
  /**
   * Message: `Could not reach the update server to load a remote update for error recovery: {cause}`
   *
   * Code: `UpdateServerUnreachable`
   */
  STARTUP_ERROR_RECOVERY_LOAD_UNREACHABLE = 'startup.errorRecoveryLoadUnreachable',
  /**
   * Message: `Marking update {updateId} as failed to launch`
   *
   * Code: `Unknown`
   */
  STARTUP_MARK_FAILED_LAUNCH = 'startup.markFailedLaunch',
  /**
   * Message: `Failed to update the {count} launch count for update: {cause}`
   *
   * Code: `None`
   */
  STARTUP_LAUNCH_COUNT_UPDATE_FAILED = 'startup.launchCountUpdateFailed',
  /**
   * Message: `Asset {assetKey} is missing from disk and could not be restored: {cause}`
   *
   * Code: `AssetsFailedToLoad`
   */
  LOCAL_ASSET_MISSING = 'local.assetMissing',
  /**
   * Message: `Existing file for asset {assetKey} is not valid ({reason}); downloading it again`
   *
   * Code: `AssetsFailedToLoad`
   */
  LOCAL_ASSET_FILE_INVALID = 'local.assetFileInvalid',
  /**
   * Message: `Skipping launchable update with no launch asset: {debugInfo}`
   *
   * Code: `None`
   */
  LOCAL_MISSING_LAUNCH_ASSET = 'local.missingLaunchAsset',
  /**
   * Message: `Failed to select old update from the database: {cause}`
   *
   * Code: `None`
   */
  LOCAL_SELECT_UPDATE_FAILED = 'local.selectUpdateFailed',
  /**
   * Message: `Loaded an update with the same ID but a different scopeKey than one already on disk. This is a server error. Overwriting the scopeKey and loading the existing update.`
   *
   * Code: `None`
   */
  LOCAL_SCOPE_KEY_MISMATCH = 'local.scopeKeyMismatch',
  /**
   * Message: `Failed to merge asset with existing database entry: {cause}`
   *
   * Code: `None`
   */
  LOCAL_MERGE_ASSET_FAILED = 'local.mergeAssetFailed',
  /**
   * Message: `Failed to mark update as recently accessed: {cause}`
   *
   * Code: `None`
   */
  LOCAL_MARK_ACCESSED_FAILED = 'local.markAccessedFailed',
  /**
   * Message: `Could not write data for downloaded asset {assetKey} to the database: {cause}`
   *
   * Code: `None`
   */
  LOCAL_ASSET_DATABASE_WRITE_FAILED = 'local.assetDatabaseWriteFailed',
  /**
   * Message: `Failed to read {field} from the database: {cause}`
   *
   * Code: `None`
   */
  LOCAL_METADATA_READ_FAILED = 'local.metadataReadFailed',
  /**
   * Message: `Error opening SQLite database: {cause}`
   *
   * Code: `InitializationError`
   */
  LOCAL_DATABASE_OPEN_FAILED = 'local.databaseOpenFailed',
  /**
   * Message: `SQLite database migration failed ({step}): {cause}`
   *
   * Code: `None`
   */
  LOCAL_DATABASE_MIGRATION_FAILED = 'local.databaseMigrationFailed',
  /**
   * Message: `No embedded file for asset {assetKey}`
   *
   * Code: `AssetsFailedToLoad`
   */
  EMBEDDED_ASSET_MISSING = 'embedded.assetMissing',
  /**
   * Message: `Error copying embedded asset {assetKey}: {cause}`
   *
   * Code: `None`
   */
  EMBEDDED_ASSET_COPY_FAILED = 'embedded.assetCopyFailed',
  /**
   * Message: `Could not use embedded asset {assetKey} ({reason}), downloading it instead`
   *
   * Code: `None`
   */
  EMBEDDED_ASSET_FALLBACK = 'embedded.assetFallback',
  /**
   * Message: `Unexpected error copying embedded update: {cause}`
   *
   * Code: `Unknown`
   */
  EMBEDDED_UPDATE_COPY_FAILED = 'embedded.updateCopyFailed',
  /**
   * Message: `Could not apply roll back to embedded update: {cause}`
   *
   * Code: `UpdateFailedToLoad`
   */
  EMBEDDED_ROLLBACK_FAILED = 'embedded.rollbackFailed',
  /**
   * Message: `Failed to launch update: {cause}`
   *
   * Code: `UpdateFailedToLoad`
   */
  LAUNCH_FAILED = 'launch.failed',
  /**
   * Message: `ErrorRecovery: a JS exception was encountered: {error}`
   *
   * Code: `JSRuntimeError`
   */
  ERROR_RECOVERY_JS_EXCEPTION = 'errorRecovery.jsException',
  /**
   * Message: `ErrorRecovery: the update failed to start: {error}`
   *
   * Code: `InitializationError`
   */
  ERROR_RECOVERY_STARTUP_FAILED = 'errorRecovery.startupFailed',
  /**
   * Message: `ErrorRecovery: could not recover from error, crashing`
   *
   * Code: `UpdateFailedToLoad`
   */
  ERROR_RECOVERY_CRASH = 'errorRecovery.crash',
  /**
   * Message: `Could not write fatal error to log: {cause}`
   *
   * Code: `None`
   */
  ERROR_RECOVERY_LOG_WRITE_FAILED = 'errorRecovery.logWriteFailed',
  /**
   * Message: `Could not read or delete the error log: {cause}`
   *
   * Code: `None`
   */
  ERROR_RECOVERY_LOG_READ_FAILED = 'errorRecovery.logReadFailed',
  /**
   * Message: `Error reaping updates: {cause}`
   *
   * Code: `None`
   */
  REAPER_FAILED = 'reaper.failed',
  /**
   * Message: `Refusing to delete asset at unsafe path {filename}`
   *
   * Code: `None`
   */
  REAPER_UNSAFE_PATH = 'reaper.unsafePath',
  /**
   * Message: `Error deleting asset at {path}: {cause}`
   *
   * Code: `None`
   */
  REAPER_ASSET_DELETE_FAILED = 'reaper.assetDeleteFailed',
  /**
   * Message: `Error {operation} static build data: {cause}`
   *
   * Code: `None`
   */
  BUILD_DATA_OPERATION_FAILED = 'buildData.operationFailed',
  /**
   * Message: `UpdatesState: invalid transition requested, event dropped: state = {state}, event = {event}`
   *
   * Code: `None`
   */
  SYSTEM_STATE_MACHINE_EVENT_DROPPED = 'system.stateMachineEventDropped',
  /**
   * Message: `Failed to set isExcludedFromBackup={value} on the updates directory: {cause}`
   *
   * Code: `None`
   */
  SYSTEM_EXCLUDE_FROM_BACKUP_FAILED = 'system.excludeFromBackupFailed',
  /**
   * Message: `Error purging old updates logs: {cause}`
   *
   * Code: `None`
   */
  SYSTEM_LOG_PURGE_FAILED = 'system.logPurgeFailed',
  /**
   * Message: `Key with alg={alg} from signature does not match client configuration algorithm, continuing`
   *
   * Code: `None`
   */
  SYSTEM_CODE_SIGNING_ALGORITHM_MISMATCH = 'system.codeSigningAlgorithmMismatch',
  /**
   * Message: `Code signing verification failed for {kind}: {cause}`
   *
   * Code: `UpdateCodeSigningError`
   */
  SYSTEM_CODE_SIGNING_VERIFICATION_FAILED = 'system.codeSigningVerificationFailed',
  /**
   * Message: `Could not determine whether the active network connection is metered; not checking for updates`
   *
   * Code: `Unknown`
   */
  SYSTEM_METERED_NETWORK_CHECK_FAILED = 'system.meteredNetworkCheckFailed',
  /**
   * Message: `Could not send state machine context to observer`
   *
   * Code: `JSRuntimeError`
   */
  SYSTEM_OBSERVER_SEND_FAILED = 'system.observerSendFailed',
  /**
   * Message: `Invalid updates configuration: {cause}`
   *
   * Code: `InitializationError`
   */
  DEV_LAUNCHER_CONFIG_INVALID = 'devLauncher.configInvalid',
  /**
   * Message: `launchAssetFile should not be called from an expo-dev-client build, except for Detox testing`
   *
   * Code: `None`
   */
  DEV_LAUNCHER_LAUNCH_ASSET_FILE_CALLED = 'devLauncher.launchAssetFileCalled',
}

/**
 * The possible settings that determine if `expo-updates` will check for updates on app startup.
 * By default, Expo will check for updates every time the app is loaded.
 * Set this to `ON_ERROR_RECOVERY` to disable automatic checking unless recovering from an error.
 * Set this to `NEVER` to completely disable automatic checking.
 */
export enum UpdatesCheckAutomaticallyValue {
  /**
   * Checks for updates whenever the app is loaded. This is the default setting.
   */
  ON_LOAD = 'ON_LOAD',
  /**
   * Only checks for updates when the app starts up after an error recovery.
   */
  ON_ERROR_RECOVERY = 'ON_ERROR_RECOVERY',
  /**
   * Only checks for updates when the app starts and has a Wi-Fi connection.
   */
  WIFI_ONLY = 'WIFI_ONLY',
  /**
   * Automatic update checks are off, and update checks must be done through the JS API.
   */
  NEVER = 'NEVER',
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
  // ISO date string with the rollback commit time
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
  // Change event emitted by native
  context: UpdatesNativeStateMachineContext;
};
