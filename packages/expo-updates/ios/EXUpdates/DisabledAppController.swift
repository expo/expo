//  Copyright © 2019 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 * Updates controller for applications that either disable updates explicitly or have an error
 * during initialization. Errors that may occur include but are not limited to:
 * - Disk access errors
 * - Internal database initialization errors
 * - Configuration errors (missing required configuration)
 */
public class DisabledAppController: InternalAppControllerInterface {
  public let isActiveController = false
  private var isStarted: Bool = false
  private var startupStartTime: DispatchTime?
  private var startupEndTime: DispatchTime?

  private var launchDuration: Double? {
    return startupStartTime.let({ start in
      startupEndTime.let { end in
        Double(end.uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000
      }
    })
  }

  public weak var delegate: AppControllerDelegate?

  private let logger = UpdatesLogger()

  public let eventManager: UpdatesEventManager

  // disabled controller state machine can only be idle or restarting
  private let stateMachine: UpdatesStateMachine

  private let initializationError: UpdatesError?
  private var launcher: AppLauncher?

  public let updatesDirectory: URL? = nil // internal for E2E test

  required init(error: UpdatesError?) {
    self.initializationError = error
    self.eventManager = QueueUpdatesEventManager(logger: self.logger)
    self.stateMachine = UpdatesStateMachine(eventManager: self.eventManager, validUpdatesStateValues: [UpdatesStateValue.idle, UpdatesStateValue.restarting])
  }

  public func start() {
    precondition(!isStarted, "AppController:start should only be called once per instance")
    isStarted = true
    startupStartTime = DispatchTime.now()

    let launcherNoDatabase = AppLauncherNoDatabase()
    launcher = launcherNoDatabase
    launcherNoDatabase.launchUpdate()

    startupEndTime = DispatchTime.now()

    delegate.let { _ in
      DispatchQueue.main.async { [weak self] in
        if let strongSelf = self {
          strongSelf.delegate?.appController(strongSelf, didStartWithSuccess: strongSelf.launchAssetUrl() != nil)
        }
      }
    }

    if let initializationError = self.initializationError {
      ErrorRecovery.writeErrorOrExceptionToLog(initializationError, logger)
    }
  }

  public func onEventListenerStartObserving() {
    stateMachine.sendContextToJS()
  }

  private func launchedUpdate() -> Update? {
    return launcher?.launchedUpdate
  }

  public func launchAssetUrl() -> URL? {
    return launcher?.launchAssetUrl
  }

  public func getConstantsForModule() -> UpdatesModuleConstants {
    return UpdatesModuleConstants(
      launchedUpdate: launchedUpdate(),
      launchDuration: launchDuration,
      embeddedUpdate: nil,
      emergencyLaunchException: self.initializationError,
      isEnabled: false,
      isUsingEmbeddedAssets: launcher?.isUsingEmbeddedAssets() ?? false,
      runtimeVersion: nil,
      checkOnLaunch: CheckAutomaticallyConfig.Never,
      requestHeaders: [:],
      assetFilesMap: launcher?.assetFilesMap,
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: false,
      initialContext: stateMachine.context
    )
  }

  public func requestRelaunch(
    success successBlockArg: @escaping () -> Void,
    error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void
  ) {
    let procedure = RecreateReactContextProcedure(triggerReloadCommandListenersReason: "Requested by JavaScript - Updates.reloadAsync()") {
      successBlockArg()
    } errorBlock: { error in
      errorBlockArg(error)
    }
    stateMachine.queueExecution(stateMachineProcedure: procedure)
  }

  public func checkForUpdate(
    success successBlockArg: @escaping (CheckForUpdateResult) -> Void,
    error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void
  ) {
    errorBlockArg(UpdatesDisabledException("Updates.checkForUpdateAsync()"))
  }

  public func fetchUpdate(
    success successBlockArg: @escaping (FetchUpdateResult) -> Void,
    error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void
  ) {
    errorBlockArg(UpdatesDisabledException("Updates.fetchUpdateAsync()"))
  }

  public func getExtraParams(
    success successBlockArg: @escaping ([String: String]?) -> Void,
    error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void
  ) {
    errorBlockArg(UpdatesDisabledException("Updates.getExtraParamsAsync()"))
  }

  public func setExtraParam(
    key: String,
    value: String?,
    success successBlockArg: @escaping () -> Void,
    error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void
  ) {
    errorBlockArg(UpdatesDisabledException("Updates.setExtraParamAsync()"))
  }

  public func setUpdateURLAndRequestHeadersOverride(_ configOverride: UpdatesConfigOverride?) throws {
    throw UpdatesDisabledException("Updates.setUpdateURLAndRequestHeadersOverride() is not supported when expo-updates is not enabled.")
  }
}
