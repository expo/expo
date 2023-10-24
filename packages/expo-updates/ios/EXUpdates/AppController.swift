//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable line_length
// swiftlint:disable type_body_length
// swiftlint:disable closure_body_length

// this class used a bunch of implicit non-null patterns for member variables. not worth refactoring to appease lint.
// swiftlint:disable force_unwrapping

import Foundation
import SwiftUI
import EXUpdatesInterface

public typealias AppRelaunchCompletionBlock = (Bool) -> Void

@objc(EXUpdatesAppControllerDelegate)
public protocol AppControllerDelegate: AnyObject {
  func appController(_ appController: AppController, didStartWithSuccess success: Bool)
}

/**
 * Main entry point to expo-updates in normal release builds (development clients, including Expo
 * Go, use a different entry point). Singleton that keeps track of updates state, holds references
 * to instances of other updates classes, and is the central hub for all updates-related tasks.
 *
 * The `start` method in this class should be invoked early in the application lifecycle, via
 * ExpoUpdatesReactDelegateHandler. It delegates to an instance of AppLoaderTask to start
 * the process of loading and launching an update, then responds appropriately depending on the
 * callbacks that are invoked.
 *
 * This class also provides getter methods to access information about the updates state, which are
 * used by the exported UpdatesModule through EXUpdatesService. Such information includes
 * references to: the database, the UpdatesConfig object, the path on disk to the updates
 * directory, any currently active AppLoaderTask, the current SelectionPolicy, the
 * error recovery handler, and the current launched update. This class is intended to be the source
 * of truth for these objects, so other classes shouldn't retain any of them indefinitely.
 */
@objc(EXUpdatesAppController)
@objcMembers
public class AppController: NSObject, AppLoaderTaskDelegate, AppLoaderTaskSwiftDelegate, ErrorRecoveryDelegate, UpdatesStateChangeDelegate {
  private static let ErrorDomain = "EXUpdatesAppController"
  private static let EXUpdatesEventName = "Expo.nativeUpdatesEvent"
  private static let EXUpdatesStateChangeEventName = "Expo.nativeUpdatesStateChangeEvent"

  // Events for the legacy UpdateEvent JS listener
  public static let UpdateAvailableEventName = "updateAvailable"
  public static let NoUpdateAvailableEventName = "noUpdateAvailable"
  public static let ErrorEventName = "error"

  /**
   Delegate which will be notified when EXUpdates has an update ready to launch and
   `launchAssetUrl` is nonnull.
   */
  public weak var delegate: AppControllerDelegate?

  /**
   The RCTBridge for which EXUpdates is providing the JS bundle and assets.
   This is optional, but required in order for `Updates.reload()` and Updates module events to work.
   */
  public weak var bridge: RCTBridge?

  /**
   The URL on disk to source asset for the RCTBridge.
   Will be null until the AppController delegate method is called.
   This should be provided in the `sourceURLForBridge:` method of RCTBridgeDelegate.
   */
  public func launchAssetUrl() -> URL? {
    return launcher?.launchAssetUrl
  }

  /**
   A dictionary of the locally downloaded assets for the current update. Keys are the remote URLs
   of the assets and values are local paths. This should be exported by the Updates JS module and
   can be used by `expo-asset` or a similar module to override React Native's asset resolution and
   use the locally downloaded assets.
   */
  public func assetFilesMap() -> [String: Any]? {
    return launcher?.assetFilesMap
  }

  public func isUsingEmbeddedAssets() -> Bool {
    guard let launcher = launcher else {
      return true
    }
    return launcher.isUsingEmbeddedAssets()
  }

  public private(set) var config: UpdatesConfig
  fileprivate var launcher: AppLauncher?
  fileprivate let database = UpdatesDatabase()
  fileprivate var defaultSelectionPolicy: SelectionPolicy
  private let errorRecovery = ErrorRecovery()
  internal private(set) var updatesDirectory: URL? // internal for E2E test
  fileprivate let controllerQueue = DispatchQueue(label: "expo.controller.ControllerQueue")
  internal fileprivate(set) var isStarted: Bool = false

  private var eventsToSendToJS: [[String: Any?]] = []

  private let stateMachine = UpdatesStateMachine()

  private var loaderTask: AppLoaderTask?
  private var candidateLauncher: AppLauncher?

  internal private(set) var isEmergencyLaunch: Bool = false

  private var _selectionPolicy: SelectionPolicy?

  internal private(set) var remoteLoadStatus: RemoteLoadStatus = .Idle

  fileprivate let logger = UpdatesLogger()

  public static let sharedInstance = AppController()

  override init() {
    var configInit: UpdatesConfig?
    do {
      configInit = try UpdatesConfig.configWithExpoPlist(mergingOtherDictionary: nil)
    } catch {
      NSException(
        name: .internalInconsistencyException,
        reason: "Cannot load configuration from Expo.plist. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
      )
      .raise()
    }
    self.config = configInit!
    self.defaultSelectionPolicy = SelectionPolicyFactory.filterAwarePolicy(
      withRuntimeVersion: UpdatesUtils.getRuntimeVersion(withConfig: self.config)
    )
    self.logger.info(message: "AppController sharedInstance created")

    super.init()

    self.errorRecovery.delegate = self
    self.stateMachine.changeEventDelegate = self
    self.stateMachine.reset()
  }

  /**
   Overrides the configuration values specified in Expo.plist with the ones provided in this
   dictionary. This method can be used if any of these values should be determined at runtime
   instead of buildtime. If used, this method must be called before any other method on the
   shared instance of AppController.
   */
  public func setConfiguration(_ configuration: [String: Any]) {
    if isStarted {
      NSException(
        name: .internalInconsistencyException,
        reason: "AppController:setConfiguration should not be called after start"
      )
      .raise()
    }

    do {
      config = try UpdatesConfig.configWithExpoPlist(mergingOtherDictionary: configuration)
    } catch {
      NSException(
        name: .internalInconsistencyException,
        reason: "Cannot load configuration from Expo.plist or merged dictionary. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
      )
      .raise()
    }

    defaultSelectionPolicy = SelectionPolicyFactory.filterAwarePolicy(
      withRuntimeVersion: UpdatesUtils.getRuntimeVersion(withConfig: config)
    )

    resetSelectionPolicyToDefault()
  }

  public func selectionPolicy() -> SelectionPolicy {
    if _selectionPolicy == nil {
      _selectionPolicy = defaultSelectionPolicy
    }
    return _selectionPolicy!
  }

  /**
   * For external modules that want to modify the selection policy used at runtime.
   *
   * This method does not provide any guarantees about how long the provided selection policy will
   * persist; sometimes expo-updates will reset the selection policy in situations where it makes
   * sense to have explicit control (e.g. if the developer/user has programmatically fetched an
   * update, expo-updates will reset the selection policy so the new update is launched on the
   * next reload).
   */
  public func setNextSelectionPolicy(_ nextSelectionPolicy: SelectionPolicy) {
    _selectionPolicy = nextSelectionPolicy
  }

  /**
   * Similar to the above method, but sets the next selection policy to whatever
   * AppController's default selection policy is.
   */
  public func resetSelectionPolicyToDefault() {
    _selectionPolicy = nil
  }

  /**
   Starts the update process to launch a previously-loaded update and (if configured to do so)
   check for a new update from the server. This method should be called as early as possible in
   the application's lifecycle.

   Note that iOS may stop showing the app's splash screen in case the update is taking a while
   to load. If your splash screen setup is simple, you may want to use the
   `startAndShowLaunchScreen:` method instead.
   */
  public func start() {
    precondition(!isStarted, "AppController:start should only be called once per instance")

    if !config.isEnabled {
      let launcherNoDatabase = AppLauncherNoDatabase()
      launcher = launcherNoDatabase
      launcherNoDatabase.launchUpdate(withConfig: config)

      delegate.let { _ in
        DispatchQueue.main.async { [weak self] in
          if let strongSelf = self {
            strongSelf.delegate?.appController(strongSelf, didStartWithSuccess: strongSelf.launchAssetUrl() != nil)
            strongSelf.sendQueuedEventsToBridge()
          }
        }
      }

      return
    }

    if config.updateUrl == nil {
      NSException(
        name: .internalInconsistencyException,
        reason: "expo-updates is enabled, but no valid URL is configured under EXUpdatesURL. If you are making a release build for the first time, make sure you have run `expo publish` at least once."
      )
      .raise()
    }

    if config.scopeKey == nil {
      NSException(
        name: .internalInconsistencyException,
        reason: "expo-updates was configured with no scope key. Make sure a valid URL is configured under EXUpdatesURL."
      )
      .raise()
    }

    isStarted = true

    purgeUpdatesLogsOlderThanOneDay()

    do {
      try initializeUpdatesDirectory()
      try initializeUpdatesDatabase()
    } catch {
      emergencyLaunch(fatalError: error as NSError)
      return
    }

    UpdatesBuildData.ensureBuildDataIsConsistentAsync(database: database, config: config)

    errorRecovery.startMonitoring()

    loaderTask = AppLoaderTask(
      withConfig: config,
      database: database,
      directory: updatesDirectory!,
      selectionPolicy: selectionPolicy(),
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

  public func requestRelaunch(completion: @escaping AppRelaunchCompletionBlock) {
    stateMachine.processEvent(UpdatesStateEventRestart())
    let launcherWithDatabase = AppLauncherWithDatabase(
      config: config,
      database: database,
      directory: updatesDirectory!,
      completionQueue: controllerQueue
    )
    candidateLauncher = launcherWithDatabase
    launcherWithDatabase.launchUpdate(withSelectionPolicy: selectionPolicy()) { error, success in
      if success {
        self.launcher = self.candidateLauncher
        completion(true)
        self.errorRecovery.startMonitoring()
        RCTReloadCommandSetBundleURL(self.launcher!.launchAssetUrl)
        RCTTriggerReloadCommandListeners("Requested by JavaScript - Updates.reloadAsync()")
        self.runReaper()
        // Reset the state machine
        self.stateMachine.reset()
      } else {
        NSLog("Failed to relaunch: %@", error!.localizedDescription)
        completion(false)
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
    sendLegacyUpdateEventToBridge(AppController.ErrorEventName, body: [
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
      sendLegacyUpdateEventToBridge(AppController.ErrorEventName, body: [
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
      sendLegacyUpdateEventToBridge(AppController.UpdateAvailableEventName, body: [
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
      sendLegacyUpdateEventToBridge(AppController.NoUpdateAvailableEventName, body: [:])
    }

    errorRecovery.notify(newRemoteLoadStatus: remoteLoadStatus)
  }

  // MARK: - Internal

  internal func initializeUpdatesDirectory() throws {
    updatesDirectory = try UpdatesUtils.initializeUpdatesDirectory()
  }

  internal func initializeUpdatesDatabase() throws {
    var dbError: Error?
    let semaphore = DispatchSemaphore(value: 0)
    database.databaseQueue.async {
      do {
        try self.database.openDatabase(inDirectory: self.updatesDirectory!)
      } catch {
        dbError = error
      }
      semaphore.signal()
    }

    _ = semaphore.wait(timeout: .distantFuture)

    if let dbError = dbError {
      throw dbError
    }
  }

  private func purgeUpdatesLogsOlderThanOneDay() {
    UpdatesUtils.purgeUpdatesLogsOlderThanOneDay()
  }

  internal func setConfigurationInternal(config: UpdatesConfig) {
    self.config = config
  }

  internal func runReaper() {
    if let launchedUpdate = launcher?.launchedUpdate {
      UpdatesReaper.reapUnusedUpdates(
        withConfig: config,
        database: database,
        directory: updatesDirectory!,
        selectionPolicy: selectionPolicy(),
        launchedUpdate: launchedUpdate
      )
    }
  }

  private func emergencyLaunch(fatalError error: NSError) {
    isEmergencyLaunch = true

    let launcherNoDatabase = AppLauncherNoDatabase()
    launcher = launcherNoDatabase
    launcherNoDatabase.launchUpdate(withConfig: config)

    delegate.let { _ in
      DispatchQueue.main.async { [weak self] in
        if let strongSelf = self {
          strongSelf.delegate?.appController(strongSelf, didStartWithSuccess: strongSelf.launchAssetUrl() != nil)
          strongSelf.sendQueuedEventsToBridge()
        }
      }
    }

    errorRecovery.writeErrorOrExceptionToLog(error)
  }

  // MARK: - Send events to JS

  internal func sendLegacyUpdateEventToBridge(_ eventType: String, body: [String: Any] ) {
    logger.info(message: "sendLegacyUpdateEventToBridge(): type = \(eventType)")
    sendEventToBridge(AppController.EXUpdatesEventName, eventType, body: body)
  }

  internal func sendUpdateStateChangeEventToBridge(_ eventType: UpdatesStateEventType, body: [String: Any?]) {
    logger.info(message: "sendUpdateStateChangeEventToBridge(): type = \(eventType)")
    sendEventToBridge(AppController.EXUpdatesStateChangeEventName, "\(eventType)", body: body)
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
      directory: updatesDirectory!,
      completionQueue: controllerQueue
    )
    candidateLauncher = launcher
    launcher.launchUpdate(withSelectionPolicy: selectionPolicy()) { error, success in
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
      directory: updatesDirectory!,
      launchedUpdate: launchedUpdate(),
      completionQueue: controllerQueue
    )
    remoteAppLoader.loadUpdate(
      fromURL: config.updateUrl!
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

      return self.selectionPolicy().shouldLoadNewUpdate(update, withLaunchedUpdate: self.launchedUpdate(), filters: updateResponse.responseHeaderData?.manifestFilters)
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

  public func checkForUpdate(_ block: @escaping (_ remoteCheckResult: RemoteCheckResult) -> Void) {
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
        fromURL: self.config.updateUrl!,
        withDatabase: self.database,
        extraHeaders: extraHeaders) { updateResponse in
          let launchedUpdate = self.launchedUpdate()
          let manifestFilters = updateResponse.responseHeaderData?.manifestFilters

          if let updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective {
            switch updateDirective {
            case is NoUpdateAvailableUpdateDirective:
              block(RemoteCheckResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.noUpdateAvailableOnServer))
              self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
              return
            case let rollBackUpdateDirective as RollBackToEmbeddedUpdateDirective:
              if !self.config.hasEmbeddedUpdate {
                block(RemoteCheckResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.rollbackNoEmbedded))
                self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
                return
              }

              guard let embeddedUpdate = embeddedUpdate else {
                block(RemoteCheckResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.rollbackNoEmbedded))
                self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
                return
              }

              if !self.selectionPolicy().shouldLoadRollBackToEmbeddedDirective(
                rollBackUpdateDirective,
                withEmbeddedUpdate: embeddedUpdate,
                launchedUpdate: launchedUpdate,
                filters: manifestFilters
              ) {
                block(RemoteCheckResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.rollbackRejectedBySelectionPolicy))
                self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
                return
              }

              block(RemoteCheckResult.rollBackToEmbedded(commitTime: rollBackUpdateDirective.commitTime))
              self.stateMachine.processEvent(
                UpdatesStateEventCheckCompleteWithRollback(rollbackCommitTime: rollBackUpdateDirective.commitTime)
              )
              return
            default:
              let error = UpdatesUnsupportedDirectiveException()
              self.stateMachine.processEvent(UpdatesStateEventCheckError(message: error.localizedDescription))
              block(RemoteCheckResult.error(error: error))
              return
            }
          }

          guard let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
            block(RemoteCheckResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.noUpdateAvailableOnServer))
            self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
            return
          }

          var shouldLaunch = false
          var failedPreviously = false
          if self.selectionPolicy().shouldLoadNewUpdate(
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
                  AppController.sharedInstance.logger.info(message: "Stored update found: ID = \(update.updateId), failureCount = \(storedUpdate.failedLaunchCount)")
                }
              } catch {}
            }
          }
          if shouldLaunch {
            block(RemoteCheckResult.updateAvailable(manifest: update.manifest.rawManifestJSON()))
            self.stateMachine.processEvent(UpdatesStateEventCheckCompleteWithUpdate(manifest: update.manifest.rawManifestJSON()))
          } else {
            let reason = failedPreviously ?
              RemoteCheckResultNotAvailableReason.updatePreviouslyFailed :
              RemoteCheckResultNotAvailableReason.updateRejectedBySelectionPolicy
            block(RemoteCheckResult.noUpdateAvailable(reason: reason))
            self.stateMachine.processEvent(UpdatesStateEventCheckComplete())
          }
        } errorBlock: { error in
          self.stateMachine.processEvent(UpdatesStateEventCheckError(message: error.localizedDescription))
          block(RemoteCheckResult.error(error: error))
          return
      }
    }
  }

  public enum FetchUpdateResult {
    case success(manifest: [String: Any])
    case failure
    case rollBackToEmbedded
    case error(error: Error)
  }

  public func fetchUpdate(_ block: @escaping (_ fetchUpdateResult: FetchUpdateResult) -> Void) {
    self.stateMachine.processEvent(UpdatesStateEventDownload())
    let remoteAppLoader = RemoteAppLoader(
      config: self.config,
      database: self.database,
      directory: self.updatesDirectory!,
      launchedUpdate: self.launchedUpdate(),
      completionQueue: controllerQueue
    )
    remoteAppLoader.loadUpdate(
      fromURL: self.config.updateUrl!
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

      return self.selectionPolicy().shouldLoadNewUpdate(
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
      AppController.sharedInstance.logger.info(
        message: "fetchUpdateAsync didLoadAsset: \(body)",
        code: .none,
        updateId: nil,
        assetId: asset.contentHash
      )
    } success: { updateResponse in
      RemoteAppLoader.processSuccessLoaderResult(
        config: self.config,
        database: self.database,
        selectionPolicy: self.selectionPolicy(),
        launchedUpdate: self.launchedUpdate(),
        directory: self.updatesDirectory!,
        loaderTaskQueue: DispatchQueue(label: "expo.loader.LoaderTaskQueue"),
        updateResponse: updateResponse,
        priorError: nil
      ) { updateToLaunch, error, didRollBackToEmbedded in
        if let error = error {
          self.stateMachine.processEvent(UpdatesStateEventDownloadError(message: error.localizedDescription))
          block(FetchUpdateResult.error(error: error))
          return
        }

        if didRollBackToEmbedded {
          block(FetchUpdateResult.rollBackToEmbedded)
          self.stateMachine.processEvent(UpdatesStateEventDownloadCompleteWithRollback())
          return
        }

        if let update = updateToLaunch {
          AppController.sharedInstance.resetSelectionPolicyToDefault()
          block(FetchUpdateResult.success(manifest: update.manifest.rawManifestJSON()))
          self.stateMachine.processEvent(UpdatesStateEventDownloadCompleteWithUpdate(manifest: update.manifest.rawManifestJSON()))
          return
        }

        block(FetchUpdateResult.failure)
        self.stateMachine.processEvent(UpdatesStateEventDownloadComplete())
        return
      }
    } error: { error in
      self.stateMachine.processEvent(UpdatesStateEventDownloadError(message: error.localizedDescription))
      block(FetchUpdateResult.error(error: error))
      return
    }
  }

  internal func getNativeStateMachineContext(_ block: @escaping (_ stateMachineContext: UpdatesStateContext) -> Void) {
    block(self.stateMachine.context)
  }

  public func getExtraParams(
    success successBlockArg: @escaping (_ extraParams: [String: String]?) -> Void,
    error errorBlockArg: @escaping (_ error: Error) -> Void
  ) {
    self.database.databaseQueue.async {
      do {
        successBlockArg(try self.database.extraParams(withScopeKey: self.config.scopeKey!))
      } catch {
        errorBlockArg(error)
      }
    }
  }

  public func setExtraParam(
    key: String,
    value: String?,
    success successBlockArg: @escaping () -> Void,
    error errorBlockArg: @escaping (_ error: Error) -> Void
  ) {
    self.database.databaseQueue.async {
      do {
        try self.database.setExtraParam(key: key, value: value, withScopeKey: self.config.scopeKey!)
        successBlockArg()
      } catch {
        errorBlockArg(error)
      }
    }
  }

  public func getEmbeddedUpdate() -> Update? {
    return EmbeddedAppLoader.embeddedManifest(withConfig: self.config, database: self.database)
  }
}

/**
 * Main entry point to expo-updates in development builds with expo-dev-client. Singleton that still
 * makes use of AppController for keeping track of updates state, but provides capabilities
 * that are not usually exposed but that expo-dev-client needs (launching and downloading a specific
 * update by URL, allowing dynamic configuration, introspecting the database).
 *
 * Implements the EXUpdatesExternalInterface from the expo-updates-interface package. This allows
 * expo-dev-client to compile without needing expo-updates to be installed.
 */
@objc(EXUpdatesDevLauncherController)
@objcMembers
public final class DevLauncherController: NSObject, UpdatesExternalInterface {
  private static let ErrorDomain = "EXUpdatesDevLauncherController"

  enum ErrorCode: Int {
    case invalidUpdateURL = 1
    case updateLaunchFailed = 4
    case configFailed = 5
  }

  private var tempConfig: UpdatesConfig?

  private weak var _bridge: AnyObject?
  public weak var bridge: AnyObject? {
    get {
      return _bridge
    }
    set(value) {
      _bridge = value
      if let value = value as? RCTBridge {
        AppController.sharedInstance.bridge = value
      }
    }
  }

  public static let sharedInstance = DevLauncherController()

  override init() {}

  public var launchAssetURL: URL? {
    return AppController.sharedInstance.launchAssetUrl()
  }

  public func reset() {
    let controller = AppController.sharedInstance
    controller.launcher = nil
    controller.isStarted = true
  }

  public func fetchUpdate(
    withConfiguration configuration: [String: Any],
    onManifest manifestBlock: @escaping UpdatesManifestBlock,
    progress progressBlock: @escaping UpdatesProgressBlock,
    success successBlock: @escaping UpdatesUpdateSuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  ) {
    guard let updatesConfiguration = setup(configuration: configuration, error: errorBlock) else {
      return
    }

    let controller = AppController.sharedInstance

    // since controller is a singleton, save its config so we can reset to it if our request fails
    tempConfig = controller.config

    setDevelopmentSelectionPolicy()
    controller.setConfigurationInternal(config: updatesConfiguration)

    let loader = RemoteAppLoader(
      config: updatesConfiguration,
      database: controller.database,
      directory: controller.updatesDirectory!,
      launchedUpdate: nil,
      completionQueue: controller.controllerQueue
    )
    loader.loadUpdate(
      fromURL: updatesConfiguration.updateUrl!
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

      return manifestBlock(update.manifest.rawManifestJSON())
    } asset: { _, successfulAssetCount, failedAssetCount, totalAssetCount in
      progressBlock(UInt(successfulAssetCount), UInt(failedAssetCount), UInt(totalAssetCount))
    } success: { updateResponse in
      guard let updateResponse = updateResponse,
        let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
        successBlock(nil)
        return
      }
      self.launch(update: update, withConfiguration: updatesConfiguration, success: successBlock, error: errorBlock)
    } error: { error in
      // reset controller's configuration to what it was before this request
      controller.setConfigurationInternal(config: self.tempConfig!)
      errorBlock(error)
    }
  }

  public func storedUpdateIds(
    withConfiguration configuration: [String: Any],
    success successBlock: @escaping UpdatesQuerySuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  ) {
    guard setup(configuration: configuration, error: errorBlock) != nil else {
      successBlock([])
      return
    }

    AppLauncherWithDatabase.storedUpdateIds(
      inDatabase: AppController.sharedInstance.database
    ) { error, storedUpdateIds in
      if let error = error {
        errorBlock(error)
      } else {
        successBlock(storedUpdateIds!)
      }
    }
  }

  /**
   Common initialization for both fetchUpdateWithConfiguration: and storedUpdateIdsWithConfiguration:
   Sets up EXUpdatesAppController shared instance
   Returns the updatesConfiguration
   */
  private func setup(configuration: [AnyHashable: Any], error errorBlock: UpdatesErrorBlock) -> UpdatesConfig? {
    let controller = AppController.sharedInstance
    var updatesConfiguration: UpdatesConfig
    do {
      updatesConfiguration = try UpdatesConfig.configWithExpoPlist(mergingOtherDictionary: configuration as? [String: Any] ?? [:])
    } catch {
      errorBlock(NSError(
        domain: DevLauncherController.ErrorDomain,
        code: ErrorCode.configFailed.rawValue,
        userInfo: [
          NSLocalizedDescriptionKey: "Cannot load configuration from Expo.plist. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
        ]
      ))
      return nil
    }

    guard updatesConfiguration.updateUrl != nil && updatesConfiguration.scopeKey != nil else {
      errorBlock(NSError(
        domain: DevLauncherController.ErrorDomain,
        code: ErrorCode.invalidUpdateURL.rawValue,
        userInfo: [
          NSLocalizedDescriptionKey: "Failed to read stored updates: configuration object must include a valid update URL"
        ]
      ))
      return nil
    }

    do {
      try controller.initializeUpdatesDirectory()
      try controller.initializeUpdatesDatabase()
    } catch {
      errorBlock(error)
      return nil
    }

    return updatesConfiguration
  }

  private func setDevelopmentSelectionPolicy() {
    let controller = AppController.sharedInstance
    controller.resetSelectionPolicyToDefault()
    let currentSelectionPolicy = controller.selectionPolicy()
    controller.defaultSelectionPolicy = SelectionPolicy(
      launcherSelectionPolicy: currentSelectionPolicy.launcherSelectionPolicy,
      loaderSelectionPolicy: currentSelectionPolicy.loaderSelectionPolicy,
      reaperSelectionPolicy: ReaperSelectionPolicyDevelopmentClient()
    )
    controller.resetSelectionPolicyToDefault()
  }

  private func launch(
    update: Update,
    withConfiguration configuration: UpdatesConfig,
    success successBlock: @escaping UpdatesUpdateSuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  ) {
    let controller = AppController.sharedInstance
    // ensure that we launch the update we want, even if it isn't the latest one
    let currentSelectionPolicy = controller.selectionPolicy()

    // Calling `setNextSelectionPolicy` allows the Updates module's `reloadAsync` method to reload
    // with a different (newer) update if one is downloaded, e.g. using `fetchUpdateAsync`. If we set
    // the default selection policy here instead, the update we are launching here would keep being
    // launched by `reloadAsync` even if a newer one is downloaded.
    controller.setNextSelectionPolicy(SelectionPolicy(
      launcherSelectionPolicy: LauncherSelectionPolicySingleUpdate(updateId: update.updateId),
      loaderSelectionPolicy: currentSelectionPolicy.loaderSelectionPolicy,
      reaperSelectionPolicy: currentSelectionPolicy.reaperSelectionPolicy
    ))

    let launcher = AppLauncherWithDatabase(
      config: configuration,
      database: controller.database,
      directory: controller.updatesDirectory!,
      completionQueue: controller.controllerQueue
    )
    launcher.launchUpdate(withSelectionPolicy: controller.selectionPolicy()) { error, success in
      if !success {
        // reset controller's configuration to what it was before this request
        controller.setConfigurationInternal(config: self.tempConfig!)
        errorBlock(error ?? NSError(
          domain: DevLauncherController.ErrorDomain,
          code: ErrorCode.updateLaunchFailed.rawValue,
          userInfo: [NSLocalizedDescriptionKey: "Failed to launch update with an unknown error"]
        ))
        return
      }

      controller.isStarted = true
      controller.launcher = launcher
      successBlock(launcher.launchedUpdate?.manifest.rawManifestJSON())
      controller.runReaper()
    }
  }
}

// swiftlint:enable force_unwrapping
// swiftlint:enable closure_body_length
// swiftlint:enable line_length
// swiftlint:enable type_body_length
