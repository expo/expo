//  Copyright © 2026 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 * Updates controller for a launch while protected data is not available, such as a background launch before the first unlock.
 * It waits for the unlock, then hands over to an enabled or disabled controller.
 * The hand-over happens before JS runs, because the React delegate handler holds the root view until the start finishes.
 */
internal final class PendingAppController: InternalAppControllerInterface {
  private let config: UpdatesConfig
  private let logger: UpdatesLogger
  private var protectedDataObserver: NSObjectProtocol?
  private var resolvedController: InternalAppControllerInterface?
  private let placeholderController = DisabledAppController(error: nil)

  private var currentController: InternalAppControllerInterface {
    return resolvedController ?? placeholderController
  }

  private weak var pendingDelegate: AppControllerDelegate?
  weak var delegate: AppControllerDelegate? {
    get { resolvedController?.delegate ?? pendingDelegate }
    set {
      pendingDelegate = newValue
      resolvedController?.delegate = newValue
    }
  }

  let isActiveController = true
  private(set) var isStarted = false

  init(config: UpdatesConfig, logger: UpdatesLogger) {
    self.config = config
    self.logger = logger
  }

  deinit {
    removeProtectedDataObserver()
  }

  func start() {
    precondition(!isStarted, "AppController:start should only be called once per instance")
    isStarted = true

#if os(iOS)
    protectedDataObserver = NotificationCenter.default.addObserver(
      forName: UIApplication.protectedDataDidBecomeAvailableNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.handOver()
    }
#endif

    // The data can become available before the observer is added.
    if UpdatesUtils.isProtectedDataAvailable() {
      handOver()
    }
  }

  private func handOver() {
    guard resolvedController == nil else {
      return
    }
    removeProtectedDataObserver()
    logger.info(message: "Protected data is available. expo-updates continues the launch.")

    let controller = AppController.initializeWithDatabase(config: config, logger: logger)
    resolvedController = controller
    controller.delegate = pendingDelegate
    controller.start()
  }

  private func removeProtectedDataObserver() {
    if let protectedDataObserver {
      NotificationCenter.default.removeObserver(protectedDataObserver)
      self.protectedDataObserver = nil
    }
  }

  // MARK: - Forwarding to the resolved controller

  func launchAssetUrl() -> URL? {
    return resolvedController?.launchAssetUrl()
  }

  var updatesDirectory: URL? {
    return currentController.updatesDirectory
  }

  var reloadScreenManager: Reloadable? {
    return currentController.reloadScreenManager
  }

  var eventManager: UpdatesEventManager {
    return currentController.eventManager
  }

  func onEventListenerStartObserving() {
    currentController.onEventListenerStartObserving()
  }

  func getConstantsForModule() -> UpdatesModuleConstants {
    return currentController.getConstantsForModule()
  }

  func requestRelaunch(
    success successBlockArg: @escaping () -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    currentController.requestRelaunch(success: successBlockArg, error: errorBlockArg)
  }

  func checkForUpdate(
    success successBlockArg: @escaping (_ checkForUpdateResult: CheckForUpdateResult) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    currentController.checkForUpdate(success: successBlockArg, error: errorBlockArg)
  }

  func fetchUpdate(
    success successBlockArg: @escaping (_ fetchUpdateResult: FetchUpdateResult) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    currentController.fetchUpdate(success: successBlockArg, error: errorBlockArg)
  }

  func getExtraParams(
    success successBlockArg: @escaping (_ extraParams: [String: String]?) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    currentController.getExtraParams(success: successBlockArg, error: errorBlockArg)
  }

  func setExtraParam(
    key: String,
    value: String?,
    success successBlockArg: @escaping () -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    currentController.setExtraParam(key: key, value: value, success: successBlockArg, error: errorBlockArg)
  }

  func setUpdateURLAndRequestHeadersOverride(_ configOverride: UpdatesConfigOverride?) throws {
    try currentController.setUpdateURLAndRequestHeadersOverride(configOverride)
  }

  func setUpdateRequestHeadersOverride(_ requestHeaders: [String: String]?) throws {
    try currentController.setUpdateRequestHeadersOverride(requestHeaders)
  }
}
