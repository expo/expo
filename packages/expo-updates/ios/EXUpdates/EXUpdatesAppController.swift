//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable file_length
// swiftlint:disable type_body_length
// swiftlint:disable line_length

// this class used a bunch of implicit non-null patterns for member variables. not worth refactoring to appease lint.
// swiftlint:disable force_unwrapping

import Foundation
import SwiftUI

@objc
public protocol EXUpdatesAppControllerDelegate: AnyObject {
  func appController(_ appController: EXUpdatesAppController, didStartWithSuccess success: Bool)
}

/**
 * Main entry point to expo-updates in normal release builds (development clients, including Expo
 * Go, use a different entry point). Singleton that keeps track of updates state, holds references
 * to instances of other updates classes, and is the central hub for all updates-related tasks.
 *
 * The `start` method in this class should be invoked early in the application lifecycle, via
 * ExpoUpdatesReactDelegateHandler. It delegates to an instance of EXUpdatesAppLoaderTask to start
 * the process of loading and launching an update, then responds appropriately depending on the
 * callbacks that are invoked.
 *
 * This class also provides getter methods to access information about the updates state, which are
 * used by the exported EXUpdatesModule through EXUpdatesService. Such information includes
 * references to: the database, the EXUpdatesConfig object, the path on disk to the updates
 * directory, any currently active EXUpdatesAppLoaderTask, the current EXUpdatesSelectionPolicy, the
 * error recovery handler, and the current launched update. This class is intended to be the source
 * of truth for these objects, so other classes shouldn't retain any of them indefinitely.
 */
@objcMembers
public class EXUpdatesAppController: NSObject, EXUpdatesAppLoaderTaskDelegate, EXUpdatesErrorRecoveryDelegate {
  private static let ErrorDomain = "EXUpdatesAppController"

  private static let UpdateAvailableEventName = "updateAvailable"
  private static let NoUpdateAvailableEventName = "noUpdateAvailable"
  private static let ErrorEventName = "error"

  /**
   Delegate which will be notified when EXUpdates has an update ready to launch and
   `launchAssetUrl` is nonnull.
   */
  public weak var delegate: EXUpdatesAppControllerDelegate?

  /**
   The RCTBridge for which EXUpdates is providing the JS bundle and assets.
   This is optional, but required in order for `Updates.reload()` and Updates module events to work.
   */
  public weak var bridge: RCTBridge?

  /**
   The URL on disk to source asset for the RCTBridge.
   Will be null until the EXUpdatesAppController delegate method is called.
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

  /**
   for internal use in EXUpdates
   */
  public var config: EXUpdatesConfig
  internal var launcher: EXUpdatesAppLauncher?
  public let database: EXUpdatesDatabase
  internal var defaultSelectionPolicy: EXUpdatesSelectionPolicy
  private let errorRecovery: EXUpdatesErrorRecovery
  public internal(set) var updatesDirectory: URL?
  internal let controllerQueue: DispatchQueue
  internal let assetFilesQueue: DispatchQueue
  public internal(set) var isStarted: Bool

  private var loaderTask: EXUpdatesAppLoaderTask?
  private var candidateLauncher: EXUpdatesAppLauncher?

  public internal(set) var isEmergencyLaunch: Bool

  private var _selectionPolicy: EXUpdatesSelectionPolicy?

  public var remoteLoadStatus: EXUpdatesRemoteLoadStatus

  private let logger: UpdatesLogger

  public static let sharedInstance = EXUpdatesAppController()

  override init() {
    var configInit: EXUpdatesConfig?
    do {
      configInit = try EXUpdatesConfig.configWithExpoPlist(mergingOtherDictionary: nil)
    } catch {
      NSException(
        name: .internalInconsistencyException,
        reason: "Cannot load configuration from Expo.plist. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
      )
      .raise()
    }
    self.config = configInit!
    self.database = EXUpdatesDatabase()
    self.defaultSelectionPolicy = EXUpdatesSelectionPolicyFactory.filterAwarePolicy(
      withRuntimeVersion: EXUpdatesUtils.getRuntimeVersion(withConfig: self.config)
    )
    self.errorRecovery = EXUpdatesErrorRecovery()
    self.assetFilesQueue = DispatchQueue(label: "expo.controller.AssetFilesQueue")
    self.controllerQueue = DispatchQueue(label: "expo.controller.ControllerQueue")
    self.isStarted = false
    self.remoteLoadStatus = .Idle
    self.isEmergencyLaunch = false
    self.logger = UpdatesLogger()
    self.logger.info(message: "EXUpdatesAppController sharedInstance created")

    super.init()

    self.errorRecovery.delegate = self
  }

  /**
   Overrides the configuration values specified in Expo.plist with the ones provided in this
   dictionary. This method can be used if any of these values should be determined at runtime
   instead of buildtime. If used, this method must be called before any other method on the
   shared instance of EXUpdatesAppController.
   */
  public func setConfiguration(_ configuration: [String: Any]) {
    if isStarted {
      NSException(
        name: .internalInconsistencyException,
        reason: "EXUpdatesAppController:setConfiguration should not be called after start"
      )
      .raise()
    }

    do {
      config = try EXUpdatesConfig.configWithExpoPlist(mergingOtherDictionary: configuration)
    } catch {
      NSException(
        name: .internalInconsistencyException,
        reason: "Cannot load configuration from Expo.plist or merged dictionary. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
      )
      .raise()
    }

    resetSelectionPolicyToDefault()
  }

  public func selectionPolicy() -> EXUpdatesSelectionPolicy {
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
  public func setNextSelectionPolicy(_ nextSelectionPolicy: EXUpdatesSelectionPolicy) {
    _selectionPolicy = nextSelectionPolicy
  }

  /**
   * Similar to the above method, but sets the next selection policy to whatever
   * EXUpdatesAppController's default selection policy is.
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
    precondition(!isStarted, "EXUpdatesAppController:start should only be called once per instance")

    if !config.isEnabled {
      let launcherNoDatabase = EXUpdatesAppLauncherNoDatabase()
      launcher = launcherNoDatabase
      launcherNoDatabase.launchUpdate(withConfig: config)

      delegate.let { _ in
        DispatchQueue.main.async { [weak self] in
          if let strongSelf = self {
            strongSelf.delegate?.appController(strongSelf, didStartWithSuccess: strongSelf.launchAssetUrl() != nil)
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

    EXUpdatesBuildData.ensureBuildDataIsConsistentAsync(database: database, config: config)

    errorRecovery.startMonitoring()

    loaderTask = EXUpdatesAppLoaderTask(
      withConfig: config,
      database: database,
      directory: updatesDirectory!,
      selectionPolicy: selectionPolicy(),
      delegateQueue: controllerQueue
    )
    loaderTask!.delegate = self
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

  public func requestRelaunch(completion: @escaping EXUpdatesAppRelaunchCompletionBlock) {
    let launcherWithDatabase = EXUpdatesAppLauncherWithDatabase(
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
      } else {
        NSLog("Failed to relaunch: %@", error!.localizedDescription)
        completion(false)
      }
    }
  }

  public func launchedUpdate() -> EXUpdatesUpdate? {
    return launcher?.launchedUpdate
  }

  // MARK: - EXUpdatesAppLoaderTaskDelegate

  public func appLoaderTask(_: EXUpdatesAppLoaderTask, didLoadCachedUpdate update: EXUpdatesUpdate) -> Bool {
    return true
  }

  public func appLoaderTask(_: EXUpdatesAppLoaderTask, didStartLoadingUpdate update: EXUpdatesUpdate) {
    logger.info(message: "EXUpdatesAppController appLoaderTask didStartLoadingUpdate", code: .none, updateId: update.loggingId(), assetId: nil)
    remoteLoadStatus = .Loading
  }

  public func appLoaderTask(_: EXUpdatesAppLoaderTask, didFinishWithLauncher launcher: EXUpdatesAppLauncher, isUpToDate: Bool) {
    let logMessage = String(
      format: "EXUpdatesAppController appLoaderTask didFinishWithLauncher, isUpToDate=%d, remoteLoadStatus=%ld",
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
      EXUpdatesUtils.runBlockOnMainThread {
        it.appController(self, didStartWithSuccess: true)
      }
    }
  }

  public func appLoaderTask(_: EXUpdatesAppLoaderTask, didFinishWithError error: Error) {
    let logMessage = String(format: "EXUpdatesAppController appLoaderTask didFinishWithError: %@", error.localizedDescription)
    logger.error(message: logMessage, code: .updateFailedToLoad)
    emergencyLaunch(fatalError: error as NSError)
  }

  public func appLoaderTask(
    _: EXUpdatesAppLoaderTask,
    didFinishBackgroundUpdateWithStatus status: EXUpdatesBackgroundUpdateStatus,
    update: EXUpdatesUpdate?,
    error: Error?
  ) {
    switch status {
    case .error:
      remoteLoadStatus = .Idle
      guard let error = error else {
        preconditionFailure("Background update with error status must have a nonnull error object")
      }
      logger.error(
        message: "EXUpdatesAppController appLoaderTask didFinishBackgroundUpdateWithStatus=Error",
        code: .none,
        updateId: update?.loggingId(),
        assetId: nil
      )
      EXUpdatesUtils.sendEvent(
        toBridge: bridge,
        withType: EXUpdatesAppController.ErrorEventName,
        body: ["message": error.localizedDescription]
      )
    case .updateAvailable:
      remoteLoadStatus = .NewUpdateLoaded
      guard let update = update else {
        preconditionFailure("Background update with error status must have a nonnull update object")
      }
      logger.info(
        message: "EXUpdatesAppController appLoaderTask didFinishBackgroundUpdateWithStatus=NewUpdateLoaded",
        code: .none,
        updateId: update.loggingId(),
        assetId: nil
      )
      EXUpdatesUtils.sendEvent(
        toBridge: bridge,
        withType: EXUpdatesAppController.UpdateAvailableEventName,
        body: [
          "manifest": update.manifest.rawManifestJSON()
        ]
      )
    case .noUpdateAvailable:
      remoteLoadStatus = .Idle
      logger.error(
        message: "EXUpdatesAppController appLoaderTask didFinishBackgroundUpdateWithStatus=NoUpdateAvailable",
        code: .noUpdatesAvailable,
        updateId: update?.loggingId(),
        assetId: nil
      )
      EXUpdatesUtils.sendEvent(toBridge: bridge, withType: EXUpdatesAppController.NoUpdateAvailableEventName, body: [:])
    }

    errorRecovery.notify(newRemoteLoadStatus: remoteLoadStatus)
  }

  // MARK: - Internal

  internal func initializeUpdatesDirectory() throws {
    updatesDirectory = try EXUpdatesUtils.initializeUpdatesDirectory()
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
    EXUpdatesUtils.purgeUpdatesLogsOlderThanOneDay()
  }

  internal func setConfigurationInternal(config: EXUpdatesConfig) {
    self.config = config
  }

  internal func runReaper() {
    if let launchedUpdate = launcher?.launchedUpdate {
      EXUpdatesReaper.reapUnusedUpdates(
        withConfig: config,
        database: database,
        directory: updatesDirectory!,
        selectionPolicy: selectionPolicy(),
        launchedUpdate: launchedUpdate
      )
    }
  }

  // MARK: - EXUpdatesErrorRecoveryDelegate

  public func relaunch(completion: @escaping (Error?, Bool) -> Void) {
    let launcher = EXUpdatesAppLauncherWithDatabase(
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

    let remoteAppLoader = EXUpdatesRemoteAppLoader(
      config: config,
      database: database,
      directory: updatesDirectory!,
      launchedUpdate: launchedUpdate(),
      completionQueue: controllerQueue
    )
    remoteAppLoader.loadUpdate(
      fromURL: config.updateUrl!
    ) { update in
      return self.selectionPolicy().shouldLoadNewUpdate(update, withLaunchedUpdate: self.launchedUpdate(), filters: update.manifestFilters)
    } asset: { _, _, _, _ in
      // do nothing for now
    } success: { update in
      self.remoteLoadStatus = update != nil ? .NewUpdateLoaded : .Idle
      self.errorRecovery.notify(newRemoteLoadStatus: self.remoteLoadStatus)
    } error: { error in
      self.logger.error(message: "EXUpdatesAppController loadRemoteUpdate error: \(error.localizedDescription)", code: .updateFailedToLoad)
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
        message: "EXUpdatesAppController markFailedLaunchForUpdate",
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

  // MARK: - internal

  private func emergencyLaunch(fatalError error: NSError) {
    isEmergencyLaunch = true

    let launcherNoDatabase = EXUpdatesAppLauncherNoDatabase()
    launcher = launcherNoDatabase
    launcherNoDatabase.launchUpdate(withConfig: config)

    delegate.let { _ in
      DispatchQueue.main.async { [weak self] in
        if let strongSelf = self {
          strongSelf.delegate?.appController(strongSelf, didStartWithSuccess: strongSelf.launchAssetUrl() != nil)
        }
      }
    }

    errorRecovery.writeErrorOrExceptionToLog(error)
  }
}
