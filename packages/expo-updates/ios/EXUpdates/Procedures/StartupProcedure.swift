//  Copyright © 2019 650 Industries. All rights reserved.

internal protocol StartupProcedureDelegate: AnyObject {
  func startupProcedureDidLaunch(_ startupProcedure: StartupProcedure)
  func startupProcedure(_ startupProcedure: StartupProcedure, errorRecoveryDidRequestRelaunchWithCompletion completion: @escaping (Error?, Bool) -> Void)
}

final class StartupProcedure: StateMachineProcedure, AppLoaderTaskDelegate, AppLoaderTaskSwiftDelegate, ErrorRecoveryDelegate {
  private let database: UpdatesDatabase
  internal let config: UpdatesConfig
  private let selectionPolicy: SelectionPolicy
  private let controllerQueue: DispatchQueue
  private let updatesDirectory: URL
  private let logger: UpdatesLogger

  init(
    database: UpdatesDatabase,
    config: UpdatesConfig,
    selectionPolicy: SelectionPolicy,
    controllerQueue: DispatchQueue,
    updatesDirectory: URL,
    logger: UpdatesLogger
  ) {
    self.database = database
    self.config = config
    self.selectionPolicy = selectionPolicy
    self.controllerQueue = controllerQueue
    self.updatesDirectory = updatesDirectory
    self.logger = logger

    self.errorRecovery.delegate = self
  }

  func getLoggerTimerLabel() -> String {
    "timer-startup"
  }

  internal weak var delegate: StartupProcedureDelegate?

  // swiftlint:disable implicitly_unwrapped_optional
  private var procedureContext: ProcedureContext!
  private var loaderTask: AppLoaderTask!
  // swiftlint:enable implicitly_unwrapped_optional

  private var candidateLauncher: AppLauncher?
  internal private(set) var launcher: AppLauncher?
  internal func setLauncher(_ launcher: AppLauncher) {
    self.launcher = launcher
  }

  private let errorRecovery = ErrorRecovery()
  private var errorRecoveryRemoteAppLoader: RemoteAppLoader?
  internal func requestStartErrorMonitoring() {
    errorRecovery.startMonitoring()
  }

  internal var remoteLoadStatus: RemoteLoadStatus = .Idle
  internal private(set) var emergencyLaunchException: Error?

  internal func launchedUpdate() -> Update? {
    return launcher?.launchedUpdate
  }
  internal func launchAssetUrl() -> URL? {
    return launcher?.launchAssetUrl
  }

  internal func assetFilesMap() -> [String: Any]? {
    return launcher?.assetFilesMap
  }

  internal func isUsingEmbeddedAssets() -> Bool {
    guard let launcher = launcher else {
      return true
    }
    return launcher.isUsingEmbeddedAssets()
  }

  func run(procedureContext: ProcedureContext) {
    self.procedureContext = procedureContext

    errorRecovery.startMonitoring()

    // swiftlint:disable force_unwrapping
    loaderTask = AppLoaderTask(
      withConfig: config,
      database: database,
      directory: updatesDirectory,
      selectionPolicy: selectionPolicy,
      delegateQueue: controllerQueue
    )
    loaderTask!.delegate = self
    loaderTask!.swiftDelegate = self
    loaderTask!.start()
    // swiftlint:enable force_unwrapping
  }

  private func emergencyLaunch(fatalError error: Error) {
    emergencyLaunchException = error

    let launcherNoDatabase = AppLauncherNoDatabase()
    launcher = launcherNoDatabase
    launcherNoDatabase.launchUpdate()

    delegate?.startupProcedureDidLaunch(self)

    ErrorRecovery.writeErrorOrExceptionToLog(error, logger)
  }

  // MARK: - AppLoaderTaskDelegate

  func appLoaderTask(_: AppLoaderTask, didLoadCachedUpdate update: Update) -> Bool {
    return true
  }

  func appLoaderTaskDidStartCheckingForRemoteUpdate(_: AppLoaderTask) {
    self.procedureContext.processStateEvent(UpdatesStateEventCheck())
  }

  func appLoaderTask(_: AppLoaderTask, didFinishCheckingForRemoteUpdateWithRemoteCheckResult remoteCheckResult: RemoteCheckResult) {
    let event: UpdatesStateEvent
    switch remoteCheckResult {
    case .noUpdateAvailable: // Not using reason to update state yet
      event = UpdatesStateEventCheckComplete()
    case .updateAvailable(let manifest):
      event = UpdatesStateEventCheckCompleteWithUpdate(manifest: manifest)
    case .rollBackToEmbedded(let commitTime):
      event = UpdatesStateEventCheckCompleteWithRollback(rollbackCommitTime: commitTime)
    }
    self.procedureContext.processStateEvent(event)
  }

  func appLoaderTask(_: AppLoaderTask, didStartLoadingUpdate update: Update?) {
    logger.info(message: "AppController appLoaderTask didStartLoadingUpdate", code: .none, updateId: update?.loggingId(), assetId: nil)
    self.procedureContext.processStateEvent(UpdatesStateEventDownload())
  }

  func appLoaderTask(_: AppLoaderTask, didFinishWithLauncher launcher: AppLauncher, isUpToDate: Bool) {
    let logMessage = String(
      format: "AppController appLoaderTask didFinishWithLauncher, isUpToDate=%d, remoteLoadStatus=%ld",
      isUpToDate,
      remoteLoadStatus.rawValue
    )
    logger.info(message: logMessage)

    // if isUpToDate is false, that means a remote update is still loading in the background (this
    // method was called with a cached update because the timer ran out) so don't update the status

    if remoteLoadStatus == .Loading && isUpToDate {
      remoteLoadStatus = .Idle
    }

    self.launcher = launcher

    delegate?.startupProcedureDidLaunch(self)
  }

  func appLoaderTask(_: AppLoaderTask, didLoadAsset asset: UpdateAsset, successfulAssetCount: Int, failedAssetCount: Int, totalAssetCount: Int) {
    let body = [
      "assetInfo": [
        "name": asset.filename,
        "successfulAssetCount": successfulAssetCount,
        "failedAssetCount": failedAssetCount,
        "totalAssetCount": totalAssetCount
      ] as [String: Any]
    ]
    logger.info(
      message: "AppController appLoaderTask didLoadAsset: \(body)",
      code: .none,
      updateId: nil,
      assetId: asset.contentHash
    )
  }

  func appLoaderTask(_: AppLoaderTask, didFinishWithError error: Error) {
    logger.error(cause: UpdatesError.startupProcedureDidFinishWithError(cause: error), code: .updateFailedToLoad)
    self.procedureContext.processStateEvent(UpdatesStateEventDownloadError(message: error.localizedDescription))
    emergencyLaunch(fatalError: error)
  }

  func appLoaderTask(
    _: AppLoaderTask,
    didFinishBackgroundUpdateWithStatus status: BackgroundUpdateStatus,
    update: Update?,
    error: Error?
  ) {
    switch status {
    case .error:
      remoteLoadStatus = .Idle
      guard let error = error else {
        preconditionFailure("Background update with error status must have a nonnull error object")
      }
      logger.error(
        cause: UpdatesError.startupProcedureDidFinishBackgroundUpdateWithStatusWithError(cause: error),
        code: .updateFailedToLoad,
        updateId: update?.loggingId(),
        assetId: nil
      )
      // Since errors can happen through a number of paths, we do these checks
      // to make sure the state machine is valid
      if self.procedureContext.getCurrentState() == .checking {
        self.procedureContext.processStateEvent(UpdatesStateEventCheckError(message: error.localizedDescription))
      } else if self.procedureContext.getCurrentState() == .downloading {
        // .downloading
        self.procedureContext.processStateEvent(UpdatesStateEventDownloadError(message: error.localizedDescription))
      }
    case .updateAvailable:
      remoteLoadStatus = .NewUpdateLoaded
      guard let update = update else {
        preconditionFailure("Background update with error status must have a nonnull update object")
      }
      logger.info(
        message: "AppController appLoaderTask didFinishBackgroundUpdateWithStatus=NewUpdateLoaded",
        code: .none,
        updateId: update.loggingId(),
        assetId: nil
      )
      self.procedureContext.processStateEvent(UpdatesStateEventDownloadCompleteWithUpdate(manifest: update.manifest.rawManifestJSON()))
    case .noUpdateAvailable:
      remoteLoadStatus = .Idle
      logger.info(
        message: "AppController appLoaderTask didFinishBackgroundUpdateWithStatus=NoUpdateAvailable",
        code: .noUpdatesAvailable,
        updateId: update?.loggingId(),
        assetId: nil
      )
      // TODO: handle rollbacks properly, but this works for now
      if self.procedureContext.getCurrentState() == .downloading {
        self.procedureContext.processStateEvent(UpdatesStateEventDownloadComplete())
      }
      // Otherwise, we don't need to call the state machine here, it already transitioned to .checkCompleteUnavailable
    }

    errorRecovery.notify(newRemoteLoadStatus: remoteLoadStatus)
  }

  func appLoaderTaskDidFinishAllLoading(_: AppLoaderTask) {
    self.procedureContext.onComplete()
  }

  // MARK: - ErrorRecoveryDelegate

  func relaunch(completion: @escaping (Error?, Bool) -> Void) {
    delegate?.startupProcedure(self, errorRecoveryDidRequestRelaunchWithCompletion: completion)
  }

  func loadRemoteUpdate() {
    if let loaderTask = loaderTask, loaderTask.isRunning {
      return
    }

    remoteLoadStatus = .Loading

    // swiftlint:disable force_unwrapping
    errorRecoveryRemoteAppLoader = RemoteAppLoader(
      config: config,
      logger: logger,
      database: database,
      directory: self.updatesDirectory,
      launchedUpdate: launchedUpdate(),
      completionQueue: controllerQueue
    )
    errorRecoveryRemoteAppLoader!.loadUpdate(
      fromURL: config.updateUrl
    ) { updateResponse in
      if let updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective {
        switch updateDirective {
        case is NoUpdateAvailableUpdateDirective:
          return false
        case is RollBackToEmbeddedUpdateDirective:
          return false
        default:
          NSException(name: .internalInconsistencyException, reason: "Unhandled update directive type").raise()
          return false
        }
      }

      guard let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
        return false
      }

      return self.selectionPolicy.shouldLoadNewUpdate(
        update,
        withLaunchedUpdate: self.launchedUpdate(),
        filters: updateResponse.responseHeaderData?.manifestFilters
      )
    } asset: { _, _, _, _ in
      // do nothing for now
    } success: { updateResponse in
      self.remoteLoadStatus = updateResponse != nil ? .NewUpdateLoaded : .Idle
      self.errorRecovery.notify(newRemoteLoadStatus: self.remoteLoadStatus)
    } error: { error in
      self.logger.error(cause: error, code: .updateFailedToLoad)
      self.remoteLoadStatus = .Idle
      self.errorRecovery.notify(newRemoteLoadStatus: self.remoteLoadStatus)
    }
    // swiftlint:enable force_unwrapping
  }

  func markFailedLaunchForLaunchedUpdate() {
    if emergencyLaunchException != nil {
      return
    }

    database.databaseQueue.async {
      guard let launchedUpdate = self.launchedUpdate() else {
        return
      }

      self.logger.warn(
        message: "AppController markFailedLaunchForUpdate",
        code: .unknown,
        updateId: launchedUpdate.loggingId(),
        assetId: nil
      )
      do {
        try self.database.incrementFailedLaunchCountForUpdate(launchedUpdate)
      } catch {
        self.logger.warn(message: "Unable to mark update as failed in the local DB: \(error.localizedDescription)")
      }
    }
  }

  func markSuccessfulLaunchForLaunchedUpdate() {
    if emergencyLaunchException != nil {
      return
    }

    database.databaseQueue.async {
      guard let launchedUpdate = self.launchedUpdate() else {
        return
      }

      do {
        try self.database.incrementSuccessfulLaunchCountForUpdate(launchedUpdate)
      } catch {
        self.logger.warn(message: "Failed to increment successful launch count for update: \(error.localizedDescription)")
      }
    }
  }

  func throwException(_ exception: NSException) {
    exception.raise()
  }
}
