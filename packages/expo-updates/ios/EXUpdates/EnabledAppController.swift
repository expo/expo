//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable force_unwrapping
// swiftlint:disable closure_body_length

import SwiftUI
import ExpoModulesCore

/**
 * Updates controller for applications that have updates enabled and properly-configured.
 */
public class EnabledAppController: AppLoaderTaskDelegate, AppLoaderTaskSwiftDelegate,
  ErrorRecoveryDelegate, UpdatesStateChangeDelegate, InternalAppControllerInterface {
  private static let ErrorDomain = "EXUpdatesAppController"
  private static let EXUpdatesEventName = "Expo.nativeUpdatesEvent"
  private static let EXUpdatesStateChangeEventName = "Expo.nativeUpdatesStateChangeEvent"

  // Events for the legacy UpdateEvent JS listener
  public static let UpdateAvailableEventName = "updateAvailable"
  public static let NoUpdateAvailableEventName = "noUpdateAvailable"
  public static let ErrorEventName = "error"

  public weak var delegate: AppControllerDelegate?
  public weak var bridge: AnyObject?

  public func launchAssetUrl() -> URL? {
    return launcher?.launchAssetUrl
  }

  public func assetFilesMap() -> [String: Any]? {
    return launcher?.assetFilesMap
  }

  public func isUsingEmbeddedAssets() -> Bool {
    guard let launcher = launcher else {
      return true
    }
    return launcher.isUsingEmbeddedAssets()
  }

  internal let config: UpdatesConfig
  private let database: UpdatesDatabase

  private var launcher: AppLauncher?
  private let errorRecovery = ErrorRecovery()
  public let updatesDirectory: URL? // internal for E2E test
  private let updatesDirectoryInternal: URL
  private let controllerQueue = DispatchQueue(label: "expo.controller.ControllerQueue")
  public private(set) var isStarted = false

  private var eventsToSendToJS: [[String: Any?]] = []

  private let stateMachine = UpdatesStateMachine()

  private var loaderTask: AppLoaderTask?
  private var candidateLauncher: AppLauncher?

  private var isEmergencyLaunch: Bool = false

  private let selectionPolicy: SelectionPolicy

  internal var remoteLoadStatus: RemoteLoadStatus = .Idle

  private let logger = UpdatesLogger()

  required init(config: UpdatesConfig, database: UpdatesDatabase, updatesDirectory: URL) {
    self.config = config
    self.database = database
    self.updatesDirectoryInternal = updatesDirectory
    self.updatesDirectory = updatesDirectory
    self.selectionPolicy = SelectionPolicyFactory.filterAwarePolicy(
      withRuntimeVersion: self.config.runtimeVersionRealized
    )
    self.logger.info(message: "AppController sharedInstance created")

    self.errorRecovery.delegate = self
    self.stateMachine.changeEventDelegate = self
    self.stateMachine.reset()
  }

  public func start() {
    precondition(!isStarted, "AppController:start should only be called once per instance")

    isStarted = true

    purgeUpdatesLogsOlderThanOneDay()

    UpdatesBuildData.ensureBuildDataIsConsistentAsync(database: database, config: config)

    errorRecovery.startMonitoring()

    loaderTask = AppLoaderTask(
      withConfig: config,
      database: database,
      directory: updatesDirectoryInternal,
      selectionPolicy: selectionPolicy,
      delegateQueue: controllerQueue
    )
    loaderTask!.delegate = self
    loaderTask!.swiftDelegate = self
    loaderTask!.start()
  }

  /**
   Starts the update process to launch a previously-loaded update and (if configured to do so)
   check for a new update from the server. This method should be called as early as possible in
   the application's lifecycle.

   Note that iOS may stop showing the app's splash screen in case the update is taking a while
   to load. This method will attempt to find `LaunchScreen.xib` and load it into view while the
   update is loading.
   */
  public func startAndShowLaunchScreen(_ window: UIWindow) {
    var view: UIView?
    let mainBundle = Bundle.main
    let launchScreen = mainBundle.object(forInfoDictionaryKey: "UILaunchStoryboardName") as? String ?? "LaunchScreen"

    if mainBundle.path(forResource: launchScreen, ofType: "nib") != nil {
      let views = mainBundle.loadNibNamed(launchScreen, owner: self)
      view = views?.first as? UIView
      view?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    } else if mainBundle.path(forResource: launchScreen, ofType: "storyboard") != nil ||
      mainBundle.path(forResource: launchScreen, ofType: "storyboardc") != nil {
      let launchScreenStoryboard = UIStoryboard(name: launchScreen, bundle: nil)
      let viewController = launchScreenStoryboard.instantiateInitialViewController()
      view = viewController?.view
      viewController?.view = nil
    } else {
      NSLog("Launch screen could not be loaded from a .xib or .storyboard. Unexpected loading behavior may occur.")
      view = UIView()
      view?.backgroundColor = .white
    }

    if window.rootViewController == nil {
      window.rootViewController = UIViewController()
    }
    window.rootViewController!.view = view
    window.makeKeyAndVisible()

    start()
  }

  public func requestRelaunch(
    success successBlockArg: @escaping () -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    stateMachine.processEvent(UpdatesStateEventRestart())
    let launcherWithDatabase = AppLauncherWithDatabase(
      config: config,
      database: database,
      directory: updatesDirectoryInternal,
      completionQueue: controllerQueue
    )
    candidateLauncher = launcherWithDatabase
    launcherWithDatabase.launchUpdate(withSelectionPolicy: selectionPolicy) { error, success in
      if success {
        self.launcher = self.candidateLauncher
        successBlockArg()
        self.errorRecovery.startMonitoring()
        RCTReloadCommandSetBundleURL(self.launcher!.launchAssetUrl)
        RCTTriggerReloadCommandListeners("Requested by JavaScript - Updates.reloadAsync()")
        self.runReaper()
        // Reset the state machine
        self.stateMachine.reset()
      } else {
        NSLog("Failed to relaunch: %@", error!.localizedDescription)
        errorBlockArg(UpdatesReloadException())
      }
    }
  }

  public func launchedUpdate() -> Update? {
    return launcher?.launchedUpdate
  }

  // MARK: - AppLoaderTaskDelegate

  public func appLoaderTask(_: AppLoaderTask, didLoadCachedUpdate update: Update) -> Bool {
    return true
  }

  public func appLoaderTaskDidStartCheckingForRemoteUpdate(_: AppLoaderTask) {
    stateMachine.processEvent(UpdatesStateEventCheck())
  }

  public func appLoaderTask(_: AppLoaderTask, didFinishCheckingForRemoteUpdateWithRemoteCheckResult remoteCheckResult: RemoteCheckResult) {
    let event: UpdatesStateEvent
    switch remoteCheckResult {
    case .noUpdateAvailable: // Not using reason to update state yet
      event = UpdatesStateEventCheckComplete()
    case .updateAvailable(let manifest):
      event = UpdatesStateEventCheckCompleteWithUpdate(manifest: manifest)
    case .rollBackToEmbedded(let commitTime):
      event = UpdatesStateEventCheckCompleteWithRollback(rollbackCommitTime: commitTime)
    case .error(let error):
      event = UpdatesStateEventCheckError(message: error.localizedDescription)
    }
    stateMachine.processEvent(event)
  }

  public func appLoaderTask(_: AppLoaderTask, didStartLoadingUpdate update: Update?) {
    logger.info(message: "AppController appLoaderTask didStartLoadingUpdate", code: .none, updateId: update?.loggingId(), assetId: nil)
    stateMachine.processEvent(UpdatesStateEventDownload())
  }

  public func appLoaderTask(_: AppLoaderTask, didFinishWithLauncher launcher: AppLauncher, isUpToDate: Bool) {
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

    delegate.let { it in
      UpdatesUtils.runBlockOnMainThread {
        it.appController(self, didStartWithSuccess: true)
        self.sendQueuedEventsToBridge()
      }
    }
  }

  public func appLoaderTask(_: AppLoaderTask, didLoadAsset asset: UpdateAsset, successfulAssetCount: Int, failedAssetCount: Int, totalAssetCount: Int) {
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

  public func appLoaderTask(_: AppLoaderTask, didFinishWithError error: Error) {
    let logMessage = String(format: "AppController appLoaderTask didFinishWithError: %@", error.localizedDescription)
    logger.error(message: logMessage, code: .updateFailedToLoad)
    stateMachine.processEvent(UpdatesStateEventDownloadError(message: error.localizedDescription))
    // Send legacy UpdateEvents to JS
    sendLegacyUpdateEventToBridge(EnabledAppController.ErrorEventName, body: [
      "message": error.localizedDescription
    ])
    emergencyLaunch(fatalError: error as NSError)
  }

  public func appLoaderTask(
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
        message: "AppController appLoaderTask didFinishBackgroundUpdateWithStatus=Error",
        code: .updateFailedToLoad,
        updateId: update?.loggingId(),
        assetId: nil
      )
      // Since errors can happen through a number of paths, we do these checks
      // to make sure the state machine is valid
      if stateMachine.state == .checking {
        stateMachine.processEvent(UpdatesStateEventCheckError(message: error.localizedDescription))
      } else if stateMachine.state == .downloading {
        // .downloading
        stateMachine.processEvent(UpdatesStateEventDownloadError(message: error.localizedDescription))
      }
      // Send UpdateEvents to JS
      sendLegacyUpdateEventToBridge(EnabledAppController.ErrorEventName, body: [
        "message": error.localizedDescription
      ])
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
      stateMachine.processEvent(UpdatesStateEventDownloadCompleteWithUpdate(manifest: update.manifest.rawManifestJSON()))
      // Send UpdateEvents to JS
      sendLegacyUpdateEventToBridge(EnabledAppController.UpdateAvailableEventName, body: [
        "manifest": update.manifest.rawManifestJSON()
      ])
    case .noUpdateAvailable:
      remoteLoadStatus = .Idle
      logger.info(
        message: "AppController appLoaderTask didFinishBackgroundUpdateWithStatus=NoUpdateAvailable",
        code: .noUpdatesAvailable,
        updateId: update?.loggingId(),
        assetId: nil
      )
      // TODO: handle rollbacks properly, but this works for now
      if stateMachine.state == .downloading {
        stateMachine.processEvent(UpdatesStateEventDownloadComplete())
      }
      // Otherwise, we don't need to call the state machine here, it already transitioned to .checkCompleteUnavailable
      // Send UpdateEvents to JS
      sendLegacyUpdateEventToBridge(EnabledAppController.NoUpdateAvailableEventName, body: [:])
    }

    errorRecovery.notify(newRemoteLoadStatus: remoteLoadStatus)
  }

  // MARK: - Internal

  private func purgeUpdatesLogsOlderThanOneDay() {
    UpdatesUtils.purgeUpdatesLogsOlderThanOneDay()
  }

  internal func runReaper() {
    if let launchedUpdate = launcher?.launchedUpdate {
      UpdatesReaper.reapUnusedUpdates(
        withConfig: config,
        database: database,
        directory: updatesDirectoryInternal,
        selectionPolicy: selectionPolicy,
        launchedUpdate: launchedUpdate
      )
    }
  }

  private func emergencyLaunch(fatalError error: NSError) {
    isEmergencyLaunch = true

    let launcherNoDatabase = AppLauncherNoDatabase()
    launcher = launcherNoDatabase
    launcherNoDatabase.launchUpdate()

    delegate.let { _ in
      DispatchQueue.main.async { [weak self] in
        if let strongSelf = self {
          strongSelf.delegate?.appController(strongSelf, didStartWithSuccess: strongSelf.launchAssetUrl() != nil)
          strongSelf.sendQueuedEventsToBridge()
        }
      }
    }

    ErrorRecovery.writeErrorOrExceptionToLog(error)
  }

  // MARK: - Send events to JS

  internal func sendLegacyUpdateEventToBridge(_ eventType: String, body: [String: Any] ) {
    logger.info(message: "sendLegacyUpdateEventToBridge(): type = \(eventType)")
    sendEventToBridge(EnabledAppController.EXUpdatesEventName, eventType, body: body)
  }

  internal func sendUpdateStateChangeEventToBridge(_ eventType: UpdatesStateEventType, body: [String: Any?]) {
    logger.info(message: "sendUpdateStateChangeEventToBridge(): type = \(eventType)")
    sendEventToBridge(EnabledAppController.EXUpdatesStateChangeEventName, "\(eventType)", body: body)
  }

  private func sendEventToBridge(_ eventName: String, _ eventType: String, body: [String: Any?]) {
    var mutableBody = body
    mutableBody["type"] = eventType

    guard let bridge = bridge else {
      eventsToSendToJS.append([
        "eventName": eventName,
        "mutableBody": mutableBody
      ])
      logger.warn(message: "EXUpdates: Could not emit event: name = \(eventName), type = \(eventType). Event will be emitted when the bridge is available", code: .jsRuntimeError)
      return
    }
    logger.debug(message: "sendEventToBridge: \(eventName), \(mutableBody)")
    bridge.enqueueJSCall("RCTDeviceEventEmitter.emit", args: [eventName, mutableBody])
  }

  internal func sendQueuedEventsToBridge() {
    guard let bridge = bridge else {
      return
    }
    eventsToSendToJS.forEach { event in
      guard let eventName = event["eventName"] as? String,
        let mutableBody = event["mutableBody"] as? [String: Any?] else {
        return
      }
      logger.debug(message: "sendEventToBridge: \(eventName), \(mutableBody)")
      bridge.enqueueJSCall("RCTDeviceEventEmitter.emit", args: [eventName, mutableBody])
    }
    eventsToSendToJS = []
  }

  // MARK: - ErrorRecoveryDelegate

  public func relaunch(completion: @escaping (Error?, Bool) -> Void) {
    let launcher = AppLauncherWithDatabase(
      config: config,
      database: database,
      directory: updatesDirectoryInternal,
      completionQueue: controllerQueue
    )
    candidateLauncher = launcher
    launcher.launchUpdate(withSelectionPolicy: selectionPolicy) { error, success in
      if success {
        self.launcher = self.candidateLauncher
        self.errorRecovery.startMonitoring()
        RCTReloadCommandSetBundleURL(launcher.launchAssetUrl)
        RCTTriggerReloadCommandListeners("Relaunch after fatal error")
        completion(nil, true)
      } else {
        completion(error, false)
      }
    }
  }

  public func loadRemoteUpdate() {
    if let loaderTask = loaderTask, loaderTask.isRunning {
      return
    }

    remoteLoadStatus = .Loading

    let remoteAppLoader = RemoteAppLoader(
      config: config,
      database: database,
      directory: updatesDirectoryInternal,
      launchedUpdate: launchedUpdate(),
      completionQueue: controllerQueue
    )
    remoteAppLoader.loadUpdate(
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
      self.logger.error(message: "AppController loadRemoteUpdate error: \(error.localizedDescription)", code: .updateFailedToLoad)
      self.remoteLoadStatus = .Idle
      self.errorRecovery.notify(newRemoteLoadStatus: self.remoteLoadStatus)
    }
  }

  public func markFailedLaunchForLaunchedUpdate() {
    if isEmergencyLaunch {
      return
    }

    database.databaseQueue.async {
      guard let launchedUpdate = self.launchedUpdate() else {
        return
      }

      self.logger.error(
        message: "AppController markFailedLaunchForUpdate",
        code: .unknown,
        updateId: launchedUpdate.loggingId(),
        assetId: nil
      )
      do {
        try self.database.incrementFailedLaunchCountForUpdate(launchedUpdate)
      } catch {
        NSLog("Unable to mark update as failed in the local DB: %@", error.localizedDescription)
      }
    }
  }

  public func markSuccessfulLaunchForLaunchedUpdate() {
    if isEmergencyLaunch {
      return
    }

    database.databaseQueue.async {
      guard let launchedUpdate = self.launchedUpdate() else {
        return
      }

      do {
        try self.database.incrementSuccessfulLaunchCountForUpdate(launchedUpdate)
      } catch {
        NSLog("Failed to increment successful launch count for update: %@", error.localizedDescription)
      }
    }
  }

  public func throwException(_ exception: NSException) {
    exception.raise()
  }

  // MARK: - JS API

  public func getConstantsForModule() -> UpdatesModuleConstants {
    return UpdatesModuleConstants(
      launchedUpdate: launchedUpdate(),
      embeddedUpdate: getEmbeddedUpdate(),
      isEmergencyLaunch: isEmergencyLaunch,
      isEnabled: true,
      releaseChannel: self.config.releaseChannel,
      isUsingEmbeddedAssets: isUsingEmbeddedAssets(),
      runtimeVersion: self.config.runtimeVersionRaw ?? "",
      checkOnLaunch: self.config.checkOnLaunch,
      requestHeaders: self.config.requestHeaders,
      assetFilesMap: assetFilesMap(),
      isMissingRuntimeVersion: false
    )
  }

  public func checkForUpdate(
    success successBlockArg: @escaping (_ remoteCheckResult: RemoteCheckResult) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    stateMachine.processEvent(UpdatesStateEventCheck())

    database.databaseQueue.async {
      let embeddedUpdate = EmbeddedAppLoader.embeddedManifest(withConfig: self.config, database: self.database)
      let extraHeaders = FileDownloader.extraHeadersForRemoteUpdateRequest(
        withDatabase: self.database,
        config: self.config,
        launchedUpdate: self.launchedUpdate(),
        embeddedUpdate: embeddedUpdate
      )

      FileDownloader(config: self.config).downloadRemoteUpdate(
        fromURL: self.config.updateUrl,
        withDatabase: self.database,
        extraHeaders: extraHeaders) { updateResponse in
          let launchedUpdate = self.launchedUpdate()
          let manifestFilters = updateResponse.responseHeaderData?.manifestFilters

          if let updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective {
            switch updateDirective {
            case is NoUpdateAvailableUpdateDirective:
              successBlockArg(RemoteCheckResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.noUpdateAvailableOnServer))
              self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
              return
            case let rollBackUpdateDirective as RollBackToEmbeddedUpdateDirective:
              if !self.config.hasEmbeddedUpdate {
                successBlockArg(RemoteCheckResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.rollbackNoEmbedded))
                self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
                return
              }

              guard let embeddedUpdate = embeddedUpdate else {
                successBlockArg(RemoteCheckResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.rollbackNoEmbedded))
                self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
                return
              }

              if !self.selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
                rollBackUpdateDirective,
                withEmbeddedUpdate: embeddedUpdate,
                launchedUpdate: launchedUpdate,
                filters: manifestFilters
              ) {
                successBlockArg(RemoteCheckResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.rollbackRejectedBySelectionPolicy))
                self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
                return
              }

              successBlockArg(RemoteCheckResult.rollBackToEmbedded(commitTime: rollBackUpdateDirective.commitTime))
              self.stateMachine.processEvent(
                UpdatesStateEventCheckCompleteWithRollback(rollbackCommitTime: rollBackUpdateDirective.commitTime)
              )
              return
            default:
              let error = UpdatesUnsupportedDirectiveException()
              self.stateMachine.processEvent(UpdatesStateEventCheckError(message: error.localizedDescription))
              successBlockArg(RemoteCheckResult.error(error: error))
              return
            }
          }

          guard let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
            successBlockArg(RemoteCheckResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.noUpdateAvailableOnServer))
            self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
            return
          }

          var shouldLaunch = false
          var failedPreviously = false
          if self.selectionPolicy.shouldLoadNewUpdate(
            update,
            withLaunchedUpdate: launchedUpdate,
            filters: manifestFilters
          ) {
            // If "update" has failed to launch previously, then
            // "launchedUpdate" will be an earlier update, and the test above
            // will return true (incorrectly).
            // We check to see if the new update is already in the DB, and if so,
            // only allow the update if it has had no launch failures.
            shouldLaunch = true
            self.database.databaseQueue.sync {
              do {
                let storedUpdate = try self.database.update(withId: update.updateId, config: self.config)
                if let storedUpdate = storedUpdate {
                  shouldLaunch = storedUpdate.failedLaunchCount == 0 || storedUpdate.successfulLaunchCount > 0
                  failedPreviously = !shouldLaunch
                  self.logger.info(message: "Stored update found: ID = \(update.updateId), failureCount = \(storedUpdate.failedLaunchCount)")
                }
              } catch {}
            }
          }
          if shouldLaunch {
            successBlockArg(RemoteCheckResult.updateAvailable(manifest: update.manifest.rawManifestJSON()))
            self.stateMachine.processEvent(UpdatesStateEventCheckCompleteWithUpdate(manifest: update.manifest.rawManifestJSON()))
          } else {
            let reason = failedPreviously ?
              RemoteCheckResultNotAvailableReason.updatePreviouslyFailed :
              RemoteCheckResultNotAvailableReason.updateRejectedBySelectionPolicy
            successBlockArg(RemoteCheckResult.noUpdateAvailable(reason: reason))
            self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
          }
        } errorBlock: { error in
          self.stateMachine.processEvent(UpdatesStateEventCheckError(message: error.localizedDescription))
          successBlockArg(RemoteCheckResult.error(error: error))
          return
      }
    }
  }

  public func fetchUpdate(
    success successBlockArg: @escaping (_ fetchUpdateResult: FetchUpdateResult) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    self.stateMachine.processEvent(UpdatesStateEventDownload())
    let remoteAppLoader = RemoteAppLoader(
      config: self.config,
      database: self.database,
      directory: self.updatesDirectoryInternal,
      launchedUpdate: self.launchedUpdate(),
      completionQueue: controllerQueue
    )
    remoteAppLoader.loadUpdate(
      fromURL: self.config.updateUrl
    ) { updateResponse in
      if let updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective {
        switch updateDirective {
        case is NoUpdateAvailableUpdateDirective:
          return false
        case is RollBackToEmbeddedUpdateDirective:
          return true
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
    } asset: { asset, successfulAssetCount, failedAssetCount, totalAssetCount in
      let body = [
        "assetInfo": [
          "assetName": asset.filename,
          "successfulAssetCount": successfulAssetCount,
          "failedAssetCount": failedAssetCount,
          "totalAssetCount": totalAssetCount
        ] as [String: Any]
      ] as [String: Any]
      self.logger.info(
        message: "fetchUpdateAsync didLoadAsset: \(body)",
        code: .none,
        updateId: nil,
        assetId: asset.contentHash
      )
    } success: { updateResponse in
      RemoteAppLoader.processSuccessLoaderResult(
        config: self.config,
        database: self.database,
        selectionPolicy: self.selectionPolicy,
        launchedUpdate: self.launchedUpdate(),
        directory: self.updatesDirectoryInternal,
        loaderTaskQueue: DispatchQueue(label: "expo.loader.LoaderTaskQueue"),
        updateResponse: updateResponse,
        priorError: nil
      ) { updateToLaunch, error, didRollBackToEmbedded in
        if let error = error {
          self.stateMachine.processEvent(UpdatesStateEventDownloadError(message: error.localizedDescription))
          successBlockArg(FetchUpdateResult.error(error: error))
          return
        }

        if didRollBackToEmbedded {
          successBlockArg(FetchUpdateResult.rollBackToEmbedded)
          self.stateMachine.processEvent(UpdatesStateEventDownloadCompleteWithRollback())
          return
        }

        if let update = updateToLaunch {
          successBlockArg(FetchUpdateResult.success(manifest: update.manifest.rawManifestJSON()))
          self.stateMachine.processEvent(UpdatesStateEventDownloadCompleteWithUpdate(manifest: update.manifest.rawManifestJSON()))
          return
        }

        successBlockArg(FetchUpdateResult.failure)
        self.stateMachine.processEvent(UpdatesStateEventDownloadComplete())
        return
      }
    } error: { error in
      self.stateMachine.processEvent(UpdatesStateEventDownloadError(message: error.localizedDescription))
      successBlockArg(FetchUpdateResult.error(error: error))
      return
    }
  }

  public func getNativeStateMachineContext(
    success successBlockArg: @escaping (_ stateMachineContext: UpdatesStateContext) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    successBlockArg(self.stateMachine.context)
  }

  public func getExtraParams(
    success successBlockArg: @escaping (_ extraParams: [String: String]?) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    self.database.databaseQueue.async {
      do {
        successBlockArg(try self.database.extraParams(withScopeKey: self.config.scopeKey))
      } catch {
        errorBlockArg(UnexpectedException(error))
      }
    }
  }

  public func setExtraParam(
    key: String,
    value: String?,
    success successBlockArg: @escaping () -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    self.database.databaseQueue.async {
      do {
        try self.database.setExtraParam(key: key, value: value, withScopeKey: self.config.scopeKey)
        successBlockArg()
      } catch {
        errorBlockArg(UnexpectedException(error))
      }
    }
  }

  public func getEmbeddedUpdate() -> Update? {
    return EmbeddedAppLoader.embeddedManifest(withConfig: self.config, database: self.database)
  }
}

// swiftlint:enable closure_body_length
// swiftlint:enable force_unwrapping
