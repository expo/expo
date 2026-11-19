package expo.modules.updatesinterface

/**
 * The warnings and errors that expo-updates logs. Each key has a template with `{name}`
 * placeholders, filled from the values of the log entry, and the error code of the entries it logs.
 *
 * `UpdatesLogMessage.swift` defines the same keys for iOS, and `UpdatesLogMessageKey` in
 * expo-updates lists them for JavaScript. A Jest test in expo-updates fails when the three lists
 * differ.
 */
enum class UpdatesLogMessage(val key: String, val template: String, val code: UpdatesErrorCode) {
  // Configuration and initialization

  ConfigDisabledInvalidConfiguration(
    "config.disabledInvalidConfiguration",
    "The expo-updates system is disabled due to an invalid configuration: {cause}",
    UpdatesErrorCode.InitializationError
  ),
  ConfigDisabledExplicitly(
    "config.disabledExplicitly",
    "The expo-updates system is explicitly disabled. To enable it, set the enabled setting to true.",
    UpdatesErrorCode.InitializationError
  ),
  ControllerInitializationFailed(
    "controller.initializationFailed",
    "The expo-updates system is disabled due to an error during initialization: {cause}",
    UpdatesErrorCode.InitializationError
  ),
  ConfigOverrideInvalid(
    "config.overrideInvalid",
    "Failed to override the configuration: {reason}",
    UpdatesErrorCode.None
  ),

  // Remote: the update server

  RemoteCheckFailed(
    "remote.checkFailed",
    "Failed to check for update: {cause}",
    UpdatesErrorCode.UpdateFailedToLoad
  ),
  RemoteCheckUnreachable(
    "remote.checkUnreachable",
    "Could not reach the update server to check for an update: {cause}",
    UpdatesErrorCode.UpdateServerUnreachable
  ),
  RemoteFetchFailed(
    "remote.fetchFailed",
    "Failed to download new update: {cause}",
    UpdatesErrorCode.UpdateFailedToLoad
  ),
  RemoteFetchUnreachable(
    "remote.fetchUnreachable",
    "Could not reach the update server to download a new update: {cause}",
    UpdatesErrorCode.UpdateServerUnreachable
  ),
  RemoteAssetsFailed(
    "remote.assetsFailed",
    "Failed to load {count} asset(s) ({assetKeys}): {cause}",
    UpdatesErrorCode.AssetsFailedToLoad
  ),
  RemoteAssetsUnreachable(
    "remote.assetsUnreachable",
    "Could not reach the update server to load {count} asset(s) ({assetKeys}): {cause}",
    UpdatesErrorCode.UpdateServerUnreachable
  ),
  RemoteAssetDownloadFailed(
    "remote.assetDownloadFailed",
    "Failed to download asset {assetKey}: {cause}",
    UpdatesErrorCode.AssetsFailedToLoad
  ),
  RemoteAssetDownloadUnreachable(
    "remote.assetDownloadUnreachable",
    "Could not reach the update server to download asset {assetKey}: {cause}",
    UpdatesErrorCode.UpdateServerUnreachable
  ),
  RemotePatchFallback(
    "remote.patchFallback",
    "Could not apply a patch for asset {assetKey} ({reason}); retrying with a full download",
    UpdatesErrorCode.AssetsFailedToLoad
  ),
  RemoteExtraParamsHeaderInvalid(
    "remote.extraParamsHeaderInvalid",
    "Could not build the Expo-Extra-Params header; the request is sent without it: {cause}",
    UpdatesErrorCode.None
  ),

  // Startup

  StartupRemoteLoadFailed(
    "startup.remoteLoadFailed",
    "Failed to load remote update: {cause}",
    UpdatesErrorCode.UpdateFailedToLoad
  ),
  StartupRemoteLoadUnreachable(
    "startup.remoteLoadUnreachable",
    "Could not reach the update server to load a remote update: {cause}",
    UpdatesErrorCode.UpdateServerUnreachable
  ),
  StartupErrorRecoveryLoadFailed(
    "startup.errorRecoveryLoadFailed",
    "Failed to load remote update for error recovery: {cause}",
    UpdatesErrorCode.UpdateFailedToLoad
  ),
  StartupErrorRecoveryLoadUnreachable(
    "startup.errorRecoveryLoadUnreachable",
    "Could not reach the update server to load a remote update for error recovery: {cause}",
    UpdatesErrorCode.UpdateServerUnreachable
  ),
  StartupMarkFailedLaunch(
    "startup.markFailedLaunch",
    "Marking update {updateId} as failed to launch",
    UpdatesErrorCode.Unknown
  ),
  StartupLaunchCountUpdateFailed(
    "startup.launchCountUpdateFailed",
    "Failed to update the {count} launch count for update: {cause}",
    UpdatesErrorCode.None
  ),

  // Local: the updates database and files on disk

  LocalAssetMissing(
    "local.assetMissing",
    "Asset {assetKey} is missing from disk and could not be restored: {cause}",
    UpdatesErrorCode.AssetsFailedToLoad
  ),
  LocalAssetFileInvalid(
    "local.assetFileInvalid",
    "Existing file for asset {assetKey} is not valid ({reason}); downloading it again",
    UpdatesErrorCode.AssetsFailedToLoad
  ),
  LocalMissingLaunchAsset(
    "local.missingLaunchAsset",
    "Skipping launchable update with no launch asset: {debugInfo}",
    UpdatesErrorCode.None
  ),
  LocalSelectUpdateFailed(
    "local.selectUpdateFailed",
    "Failed to select old update from the database: {cause}",
    UpdatesErrorCode.None
  ),
  LocalScopeKeyMismatch(
    "local.scopeKeyMismatch",
    "Loaded an update with the same ID but a different scopeKey than one already on disk. This is a server error. Overwriting the scopeKey and loading the existing update.",
    UpdatesErrorCode.None
  ),
  LocalMergeAssetFailed(
    "local.mergeAssetFailed",
    "Failed to merge asset with existing database entry: {cause}",
    UpdatesErrorCode.None
  ),
  LocalMarkAccessedFailed(
    "local.markAccessedFailed",
    "Failed to mark update as recently accessed: {cause}",
    UpdatesErrorCode.None
  ),
  LocalAssetDatabaseWriteFailed(
    "local.assetDatabaseWriteFailed",
    "Could not write data for downloaded asset {assetKey} to the database: {cause}",
    UpdatesErrorCode.None
  ),
  LocalMetadataReadFailed(
    "local.metadataReadFailed",
    "Failed to read {field} from the database: {cause}",
    UpdatesErrorCode.None
  ),
  LocalDatabaseOpenFailed(
    "local.databaseOpenFailed",
    "Error opening SQLite database: {cause}",
    UpdatesErrorCode.InitializationError
  ),
  LocalDatabaseMigrationFailed(
    "local.databaseMigrationFailed",
    "SQLite database migration failed ({step}): {cause}",
    UpdatesErrorCode.None
  ),

  // Embedded: the update in the app binary

  EmbeddedAssetMissing(
    "embedded.assetMissing",
    "No embedded file for asset {assetKey}",
    UpdatesErrorCode.AssetsFailedToLoad
  ),
  EmbeddedAssetCopyFailed(
    "embedded.assetCopyFailed",
    "Error copying embedded asset {assetKey}: {cause}",
    UpdatesErrorCode.None
  ),
  EmbeddedAssetFallback(
    "embedded.assetFallback",
    "Could not use embedded asset {assetKey} ({reason}), downloading it instead",
    UpdatesErrorCode.None
  ),
  EmbeddedUpdateCopyFailed(
    "embedded.updateCopyFailed",
    "Unexpected error copying embedded update: {cause}",
    UpdatesErrorCode.Unknown
  ),
  EmbeddedRollbackFailed(
    "embedded.rollbackFailed",
    "Could not apply roll back to embedded update: {cause}",
    UpdatesErrorCode.UpdateFailedToLoad
  ),

  // Launch and error recovery

  LaunchFailed(
    "launch.failed",
    "Failed to launch update: {cause}",
    UpdatesErrorCode.UpdateFailedToLoad
  ),
  ErrorRecoveryJsException(
    "errorRecovery.jsException",
    "ErrorRecovery: a JS exception was encountered: {error}",
    UpdatesErrorCode.JSRuntimeError
  ),
  ErrorRecoveryStartupFailed(
    "errorRecovery.startupFailed",
    "ErrorRecovery: the update failed to start: {error}",
    UpdatesErrorCode.InitializationError
  ),
  ErrorRecoveryCrash(
    "errorRecovery.crash",
    "ErrorRecovery: could not recover from error, crashing",
    UpdatesErrorCode.UpdateFailedToLoad
  ),
  ErrorRecoveryLogWriteFailed(
    "errorRecovery.logWriteFailed",
    "Could not write fatal error to log: {cause}",
    UpdatesErrorCode.None
  ),
  ErrorRecoveryLogReadFailed(
    "errorRecovery.logReadFailed",
    "Could not read or delete the error log: {cause}",
    UpdatesErrorCode.None
  ),

  // Reaper and build data

  ReaperFailed(
    "reaper.failed",
    "Error reaping updates: {cause}",
    UpdatesErrorCode.None
  ),
  ReaperUnsafePath(
    "reaper.unsafePath",
    "Refusing to delete asset at unsafe path {filename}",
    UpdatesErrorCode.None
  ),
  ReaperAssetDeleteFailed(
    "reaper.assetDeleteFailed",
    "Error deleting asset at {path}: {cause}",
    UpdatesErrorCode.None
  ),
  BuildDataOperationFailed(
    "buildData.operationFailed",
    "Error {operation} static build data: {cause}",
    UpdatesErrorCode.None
  ),

  // System

  SystemStateMachineEventDropped(
    "system.stateMachineEventDropped",
    "UpdatesState: invalid transition requested, event dropped: state = {state}, event = {event}",
    UpdatesErrorCode.None
  ),
  SystemExcludeFromBackupFailed(
    "system.excludeFromBackupFailed",
    "Failed to set isExcludedFromBackup={value} on the updates directory: {cause}",
    UpdatesErrorCode.None
  ),
  SystemLogPurgeFailed(
    "system.logPurgeFailed",
    "Error purging old updates logs: {cause}",
    UpdatesErrorCode.None
  ),
  SystemCodeSigningAlgorithmMismatch(
    "system.codeSigningAlgorithmMismatch",
    "Key with alg={alg} from signature does not match client configuration algorithm, continuing",
    UpdatesErrorCode.None
  ),
  SystemCodeSigningVerificationFailed(
    "system.codeSigningVerificationFailed",
    "Code signing verification failed for {kind}: {cause}",
    UpdatesErrorCode.UpdateCodeSigningError
  ),
  SystemMeteredNetworkCheckFailed(
    "system.meteredNetworkCheckFailed",
    "Could not determine whether the active network connection is metered; not checking for updates",
    UpdatesErrorCode.Unknown
  ),
  SystemObserverSendFailed(
    "system.observerSendFailed",
    "Could not send state machine context to observer",
    UpdatesErrorCode.JSRuntimeError
  ),

  // Development builds

  DevLauncherConfigInvalid(
    "devLauncher.configInvalid",
    "Invalid updates configuration: {cause}",
    UpdatesErrorCode.InitializationError
  ),
  DevLauncherLaunchAssetFileCalled(
    "devLauncher.launchAssetFileCalled",
    "launchAssetFile should not be called from an expo-dev-client build, except for Detox testing",
    UpdatesErrorCode.None
  )
}
