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
  public private(set) var isStarted: Bool = false
  public var shouldEmitJsEvents = false

  public weak var appContext: AppContext?

  public weak var delegate: AppControllerDelegate?

  // disabled controller state machine can only be idle or restarting
  private let stateMachine = UpdatesStateMachine(validUpdatesStateValues: [UpdatesStateValue.idle, UpdatesStateValue.restarting])

  private let initializationError: Error?
  private var launcher: AppLauncher?

  public let updatesDirectory: URL? = nil // internal for E2E test

  required init(error: Error?) {
    self.initializationError = error
  }

  public func start() {
    precondition(!isStarted, "AppController:start should only be called once per instance")

    isStarted = true

    let launcherNoDatabase = AppLauncherNoDatabase()
    launcher = launcherNoDatabase
    launcherNoDatabase.launchUpdate()

    delegate.let { _ in
      DispatchQueue.main.async { [weak self] in
        if let strongSelf = self {
          strongSelf.delegate?.appController(strongSelf, didStartWithSuccess: strongSelf.launchAssetUrl() != nil)
        }
      }
    }

    if let initializationError = self.initializationError {
      ErrorRecovery.writeErrorOrExceptionToLog(initializationError)
    }
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
      embeddedUpdate: nil,
      emergencyLaunchException: self.initializationError,
      isEnabled: false,
      isUsingEmbeddedAssets: launcher?.isUsingEmbeddedAssets() ?? false,
      runtimeVersion: nil,
      checkOnLaunch: CheckAutomaticallyConfig.Never,
      requestHeaders: [:],
      assetFilesMap: launcher?.assetFilesMap,
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: false
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

  public func getNativeStateMachineContext(
    success successBlockArg: @escaping (UpdatesStateContext) -> Void,
    error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void
  ) {
    successBlockArg(self.stateMachine.context)
  }
}
