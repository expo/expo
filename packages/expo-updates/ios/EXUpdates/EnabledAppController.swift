//  Copyright © 2019 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

/**
 * Updates controller for applications that have updates enabled and properly-configured.
 */
public class EnabledAppController: InternalAppControllerInterface, StartupProcedureDelegate {
  public weak var delegate: AppControllerDelegate?

  internal let config: UpdatesConfig
  private let database: UpdatesDatabase

  public let updatesDirectory: URL? // internal for E2E test
  private let updatesDirectoryInternal: URL
  private let controllerQueue = DispatchQueue(label: "expo.controller.ControllerQueue")
  public let isActiveController = true
  private var isStarted = false
  private var startupStartTime: DispatchTime?
  private var startupEndTime: DispatchTime?

  private var launchDuration: Double? {
    return startupStartTime.let({ start in
      startupEndTime.let { end in
        Double(end.uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000
      }
    })
  }

  private let stateMachine: UpdatesStateMachine

  private let selectionPolicy: SelectionPolicy

  private let logger = UpdatesLogger()

  public let eventManager: UpdatesEventManager

  // swiftlint:disable implicitly_unwrapped_optional
  private var startupProcedure: StartupProcedure!
  // swiftlint:enable implicitly_unwrapped_optional

  public func launchAssetUrl() -> URL? {
    return startupProcedure.launchAssetUrl()
  }

  required init(config: UpdatesConfig, database: UpdatesDatabase, updatesDirectory: URL) {
    self.config = config
    self.database = database
    self.updatesDirectoryInternal = updatesDirectory
    self.updatesDirectory = updatesDirectory
    self.selectionPolicy = SelectionPolicyFactory.filterAwarePolicy(
      withRuntimeVersion: self.config.runtimeVersion
    )
    self.logger.info(message: "AppController sharedInstance created")
    self.eventManager = QueueUpdatesEventManager(logger: logger)
    self.stateMachine = UpdatesStateMachine(logger: self.logger, eventManager: self.eventManager, validUpdatesStateValues: Set(UpdatesStateValue.allCases))
  }

  public func start() {
    precondition(!isStarted, "AppController:start should only be called once per instance")

    isStarted = true
    startupStartTime = DispatchTime.now()

    purgeUpdatesLogsOlderThanOneDay()

    UpdatesBuildData.ensureBuildDataIsConsistentAsync(database: database, config: config, logger: logger)

    startupProcedure = StartupProcedure(
      database: self.database,
      config: self.config,
      selectionPolicy: self.selectionPolicy,
      controllerQueue: self.controllerQueue,
      updatesDirectory: self.updatesDirectoryInternal,
      logger: self.logger
    )
    startupProcedure.delegate = self
    stateMachine.queueExecution(stateMachineProcedure: startupProcedure)
  }

  public func onEventListenerStartObserving() {
    stateMachine.sendContextToJS()
  }

  // MARK: - StartupProcedureDelegate

  func startupProcedureDidLaunch(_ startupProcedure: StartupProcedure) {
    startupEndTime = DispatchTime.now()

    delegate.let { _ in
      DispatchQueue.main.async { [weak self] in
        if let strongSelf = self {
          strongSelf.delegate?.appController(strongSelf, didStartWithSuccess: strongSelf.startupProcedure.launchAssetUrl() != nil)
        }
      }
    }
  }

  func startupProcedure(_ startupProcedure: StartupProcedure, errorRecoveryDidRequestRelaunchWithCompletion completion: @escaping (Error?, Bool) -> Void) {
    let procedure = RelaunchProcedure(
      database: self.database,
      config: self.config,
      selectionPolicy: self.selectionPolicy,
      controllerQueue: self.controllerQueue,
      updatesDirectory: self.updatesDirectoryInternal,
      logger: self.logger,
      shouldRunReaper: false,
      triggerReloadCommandListenersReason: "Relaunch after fatal error"
    ) {
      return self.startupProcedure.launchedUpdate()
    } setLauncher: { newLauncher in
      self.startupProcedure.setLauncher(newLauncher)
    } requestStartErrorMonitoring: {
      self.startupProcedure.requestStartErrorMonitoring()
    } successBlock: {
      completion(nil, true)
    } errorBlock: { error in
      completion(error, false)
    }

    stateMachine.queueExecution(stateMachineProcedure: procedure)
  }

  public func requestRelaunch(
    success successBlockArg: @escaping () -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    let procedure = RelaunchProcedure(
      database: self.database,
      config: self.config,
      selectionPolicy: self.selectionPolicy,
      controllerQueue: self.controllerQueue,
      updatesDirectory: self.updatesDirectoryInternal,
      logger: self.logger,
      shouldRunReaper: true,
      triggerReloadCommandListenersReason: "Requested by JavaScript - Updates.reloadAsync()"
    ) {
      return self.startupProcedure.launchedUpdate()
    } setLauncher: { newLauncher in
      self.startupProcedure.setLauncher(newLauncher)
    } requestStartErrorMonitoring: {
      self.startupProcedure.requestStartErrorMonitoring()
    } successBlock: {
      successBlockArg()
    } errorBlock: { error in
      errorBlockArg(error)
    }

    stateMachine.queueExecution(stateMachineProcedure: procedure)
  }

  // MARK: - Internal

  private func purgeUpdatesLogsOlderThanOneDay() {
    UpdatesUtils.purgeUpdatesLogsOlderThanOneDay(logger: logger)
  }

  // MARK: - JS API

  public func getConstantsForModule() -> UpdatesModuleConstants {
    return UpdatesModuleConstants(
      launchedUpdate: startupProcedure.launchedUpdate(),
      launchDuration: launchDuration,
      embeddedUpdate: getEmbeddedUpdate(),
      emergencyLaunchException: startupProcedure.emergencyLaunchException,
      isEnabled: true,
      isUsingEmbeddedAssets: startupProcedure.isUsingEmbeddedAssets(),
      runtimeVersion: self.config.runtimeVersion,
      checkOnLaunch: self.config.checkOnLaunch,
      requestHeaders: self.config.requestHeaders,
      assetFilesMap: startupProcedure.assetFilesMap(),
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: false,
      initialContext: stateMachine.context
    )
  }

  public func checkForUpdate(
    success successBlockArg: @escaping (_ checkForUpdateResult: CheckForUpdateResult) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    let procedure = CheckForUpdateProcedure(
      database: self.database,
      config: self.config,
      selectionPolicy: self.selectionPolicy,
      logger: self.logger
    ) {
      return self.startupProcedure.launchedUpdate()
    } successBlock: { checkForUpdateResult in
      successBlockArg(checkForUpdateResult)
    } errorBlock: { error in
      errorBlockArg(error)
    }
    self.stateMachine.queueExecution(stateMachineProcedure: procedure)
  }

  public func fetchUpdate(
    success successBlockArg: @escaping (_ fetchUpdateResult: FetchUpdateResult) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  ) {
    let procedure = FetchUpdateProcedure(
      database: self.database,
      config: self.config,
      selectionPolicy: self.selectionPolicy,
      controllerQueue: self.controllerQueue,
      updatesDirectory: self.updatesDirectoryInternal,
      logger: self.logger
    ) {
      return self.startupProcedure.launchedUpdate()
    } successBlock: { fetchUpdateResult in
      successBlockArg(fetchUpdateResult)
    } errorBlock: { error in
      errorBlockArg(error)
    }
    self.stateMachine.queueExecution(stateMachineProcedure: procedure)
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

  public func setUpdateURLAndRequestHeadersOverride(_ configOverride: UpdatesConfigOverride?) throws {
    if !config.disableAntiBrickingMeasures {
      throw NotAllowedAntiBrickingMeasuresException()
    }
    UpdatesConfigOverride.save(configOverride)
  }
}
