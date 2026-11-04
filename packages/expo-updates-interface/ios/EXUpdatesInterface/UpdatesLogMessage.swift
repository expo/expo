// Copyright 2026-present 650 Industries. All rights reserved.

/**
 The warnings and errors that expo-updates logs. Each key has a template with `{name}` placeholders,
 filled from the values of the log entry, and the error code of the entries it logs.

 `UpdatesLogMessage.kt` defines the same keys for Android, and `UpdatesLogMessageKey` in expo-updates
 lists them for JavaScript. A Jest test in expo-updates fails when the three lists differ.
 */
public enum UpdatesLogMessage: String, CaseIterable, Sendable {
  // MARK: Configuration and initialization

  case configDisabledInvalidConfiguration = "config.disabledInvalidConfiguration"
  case configDisabledExplicitly = "config.disabledExplicitly"
  case controllerInitializationFailed = "controller.initializationFailed"
  case configOverrideInvalid = "config.overrideInvalid"

  // MARK: Remote: the update server

  case remoteCheckFailed = "remote.checkFailed"
  case remoteCheckUnreachable = "remote.checkUnreachable"
  case remoteFetchFailed = "remote.fetchFailed"
  case remoteFetchUnreachable = "remote.fetchUnreachable"
  case remoteAssetsFailed = "remote.assetsFailed"
  case remoteAssetsUnreachable = "remote.assetsUnreachable"
  case remoteAssetDownloadFailed = "remote.assetDownloadFailed"
  case remoteAssetDownloadUnreachable = "remote.assetDownloadUnreachable"
  case remotePatchFallback = "remote.patchFallback"
  case remoteExtraParamsHeaderInvalid = "remote.extraParamsHeaderInvalid"

  // MARK: Startup

  case startupRemoteLoadFailed = "startup.remoteLoadFailed"
  case startupRemoteLoadUnreachable = "startup.remoteLoadUnreachable"
  case startupErrorRecoveryLoadFailed = "startup.errorRecoveryLoadFailed"
  case startupErrorRecoveryLoadUnreachable = "startup.errorRecoveryLoadUnreachable"
  case startupMarkFailedLaunch = "startup.markFailedLaunch"
  case startupLaunchCountUpdateFailed = "startup.launchCountUpdateFailed"

  // MARK: Local: the updates database and files on disk

  case localAssetMissing = "local.assetMissing"
  case localAssetFileInvalid = "local.assetFileInvalid"
  case localMissingLaunchAsset = "local.missingLaunchAsset"
  case localSelectUpdateFailed = "local.selectUpdateFailed"
  case localScopeKeyMismatch = "local.scopeKeyMismatch"
  case localMergeAssetFailed = "local.mergeAssetFailed"
  case localMarkAccessedFailed = "local.markAccessedFailed"
  case localAssetDatabaseWriteFailed = "local.assetDatabaseWriteFailed"
  case localMetadataReadFailed = "local.metadataReadFailed"
  case localDatabaseOpenFailed = "local.databaseOpenFailed"
  case localDatabaseMigrationFailed = "local.databaseMigrationFailed"

  // MARK: Embedded: the update in the app binary

  case embeddedAssetMissing = "embedded.assetMissing"
  case embeddedAssetCopyFailed = "embedded.assetCopyFailed"
  case embeddedAssetFallback = "embedded.assetFallback"
  case embeddedUpdateCopyFailed = "embedded.updateCopyFailed"
  case embeddedRollbackFailed = "embedded.rollbackFailed"

  // MARK: Launch and error recovery

  case launchFailed = "launch.failed"
  case errorRecoveryJsException = "errorRecovery.jsException"
  case errorRecoveryStartupFailed = "errorRecovery.startupFailed"
  case errorRecoveryCrash = "errorRecovery.crash"
  case errorRecoveryLogWriteFailed = "errorRecovery.logWriteFailed"
  case errorRecoveryLogReadFailed = "errorRecovery.logReadFailed"

  // MARK: Reaper and build data

  case reaperFailed = "reaper.failed"
  case reaperUnsafePath = "reaper.unsafePath"
  case reaperAssetDeleteFailed = "reaper.assetDeleteFailed"
  case buildDataOperationFailed = "buildData.operationFailed"

  // MARK: System

  case systemStateMachineEventDropped = "system.stateMachineEventDropped"
  case systemExcludeFromBackupFailed = "system.excludeFromBackupFailed"
  case systemLogPurgeFailed = "system.logPurgeFailed"
  case systemCodeSigningAlgorithmMismatch = "system.codeSigningAlgorithmMismatch"
  case systemCodeSigningVerificationFailed = "system.codeSigningVerificationFailed"
  case systemMeteredNetworkCheckFailed = "system.meteredNetworkCheckFailed"
  case systemObserverSendFailed = "system.observerSendFailed"

  // MARK: Development builds

  case devLauncherConfigInvalid = "devLauncher.configInvalid"
  case devLauncherLaunchAssetFileCalled = "devLauncher.launchAssetFileCalled"

  public var template: String {
    return definition.template
  }

  public var code: UpdatesErrorCode {
    return definition.code
  }

  private var definition: (template: String, code: UpdatesErrorCode) {
    switch self {
    case .configDisabledInvalidConfiguration:
      return ("The expo-updates system is disabled due to an invalid configuration: {cause}", .initializationError)
    case .configDisabledExplicitly:
      return ("The expo-updates system is explicitly disabled. To enable it, set the enabled setting to true.", .initializationError)
    case .controllerInitializationFailed:
      return ("The expo-updates system is disabled due to an error during initialization: {cause}", .initializationError)
    case .configOverrideInvalid:
      return ("Failed to override the configuration: {reason}", .none)
    case .remoteCheckFailed:
      return ("Failed to check for update: {cause}", .updateFailedToLoad)
    case .remoteCheckUnreachable:
      return ("Could not reach the update server to check for an update: {cause}", .updateServerUnreachable)
    case .remoteFetchFailed:
      return ("Failed to download new update: {cause}", .updateFailedToLoad)
    case .remoteFetchUnreachable:
      return ("Could not reach the update server to download a new update: {cause}", .updateServerUnreachable)
    case .remoteAssetsFailed:
      return ("Failed to load {count} asset(s) ({assetKeys}): {cause}", .assetsFailedToLoad)
    case .remoteAssetsUnreachable:
      return ("Could not reach the update server to load {count} asset(s) ({assetKeys}): {cause}", .updateServerUnreachable)
    case .remoteAssetDownloadFailed:
      return ("Failed to download asset {assetKey}: {cause}", .assetsFailedToLoad)
    case .remoteAssetDownloadUnreachable:
      return ("Could not reach the update server to download asset {assetKey}: {cause}", .updateServerUnreachable)
    case .remotePatchFallback:
      return ("Could not apply a patch for asset {assetKey} ({reason}); retrying with a full download", .assetsFailedToLoad)
    case .remoteExtraParamsHeaderInvalid:
      return ("Could not build the Expo-Extra-Params header; the request is sent without it: {cause}", .none)
    case .startupRemoteLoadFailed:
      return ("Failed to load remote update: {cause}", .updateFailedToLoad)
    case .startupRemoteLoadUnreachable:
      return ("Could not reach the update server to load a remote update: {cause}", .updateServerUnreachable)
    case .startupErrorRecoveryLoadFailed:
      return ("Failed to load remote update for error recovery: {cause}", .updateFailedToLoad)
    case .startupErrorRecoveryLoadUnreachable:
      return ("Could not reach the update server to load a remote update for error recovery: {cause}", .updateServerUnreachable)
    case .startupMarkFailedLaunch:
      return ("Marking update {updateId} as failed to launch", .unknown)
    case .startupLaunchCountUpdateFailed:
      return ("Failed to update the {count} launch count for update: {cause}", .none)
    case .localAssetMissing:
      return ("Asset {assetKey} is missing from disk and could not be restored: {cause}", .assetsFailedToLoad)
    case .localAssetFileInvalid:
      return ("Existing file for asset {assetKey} is not valid ({reason}); downloading it again", .assetsFailedToLoad)
    case .localMissingLaunchAsset:
      return ("Skipping launchable update with no launch asset: {debugInfo}", .none)
    case .localSelectUpdateFailed:
      return ("Failed to select old update from the database: {cause}", .none)
    case .localScopeKeyMismatch:
      // swiftlint:disable:next line_length
      return ("Loaded an update with the same ID but a different scopeKey than one already on disk. This is a server error. Overwriting the scopeKey and loading the existing update.", .none)
    case .localMergeAssetFailed:
      return ("Failed to merge asset with existing database entry: {cause}", .none)
    case .localMarkAccessedFailed:
      return ("Failed to mark update as recently accessed: {cause}", .none)
    case .localAssetDatabaseWriteFailed:
      return ("Could not write data for downloaded asset {assetKey} to the database: {cause}", .none)
    case .localMetadataReadFailed:
      return ("Failed to read {field} from the database: {cause}", .none)
    case .localDatabaseOpenFailed:
      return ("Error opening SQLite database: {cause}", .initializationError)
    case .localDatabaseMigrationFailed:
      return ("SQLite database migration failed ({step}): {cause}", .none)
    case .embeddedAssetMissing:
      return ("No embedded file for asset {assetKey}", .assetsFailedToLoad)
    case .embeddedAssetCopyFailed:
      return ("Error copying embedded asset {assetKey}: {cause}", .none)
    case .embeddedAssetFallback:
      return ("Could not use embedded asset {assetKey} ({reason}), downloading it instead", .none)
    case .embeddedUpdateCopyFailed:
      return ("Unexpected error copying embedded update: {cause}", .unknown)
    case .embeddedRollbackFailed:
      return ("Could not apply roll back to embedded update: {cause}", .updateFailedToLoad)
    case .launchFailed:
      return ("Failed to launch update: {cause}", .updateFailedToLoad)
    case .errorRecoveryJsException:
      return ("ErrorRecovery: a JS exception was encountered: {error}", .jsRuntimeError)
    case .errorRecoveryStartupFailed:
      return ("ErrorRecovery: the update failed to start: {error}", .initializationError)
    case .errorRecoveryCrash:
      return ("ErrorRecovery: could not recover from error, crashing", .updateFailedToLoad)
    case .errorRecoveryLogWriteFailed:
      return ("Could not write fatal error to log: {cause}", .none)
    case .errorRecoveryLogReadFailed:
      return ("Could not read or delete the error log: {cause}", .none)
    case .reaperFailed:
      return ("Error reaping updates: {cause}", .none)
    case .reaperUnsafePath:
      return ("Refusing to delete asset at unsafe path {filename}", .none)
    case .reaperAssetDeleteFailed:
      return ("Error deleting asset at {path}: {cause}", .none)
    case .buildDataOperationFailed:
      return ("Error {operation} static build data: {cause}", .none)
    case .systemStateMachineEventDropped:
      return ("UpdatesState: invalid transition requested, event dropped: state = {state}, event = {event}", .none)
    case .systemExcludeFromBackupFailed:
      return ("Failed to set isExcludedFromBackup={value} on the updates directory: {cause}", .none)
    case .systemLogPurgeFailed:
      return ("Error purging old updates logs: {cause}", .none)
    case .systemCodeSigningAlgorithmMismatch:
      return ("Key with alg={alg} from signature does not match client configuration algorithm, continuing", .none)
    case .systemCodeSigningVerificationFailed:
      return ("Code signing verification failed for {kind}: {cause}", .updateCodeSigningError)
    case .systemMeteredNetworkCheckFailed:
      return ("Could not determine whether the active network connection is metered; not checking for updates", .unknown)
    case .systemObserverSendFailed:
      return ("Could not send state machine context to observer", .jsRuntimeError)
    case .devLauncherConfigInvalid:
      return ("Invalid updates configuration: {cause}", .initializationError)
    case .devLauncherLaunchAssetFileCalled:
      return ("launchAssetFile should not be called from an expo-dev-client build, except for Detox testing", .none)
    }
  }
}
