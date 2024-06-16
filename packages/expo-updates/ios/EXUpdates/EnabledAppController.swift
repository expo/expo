//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable force_unwrapping

import SwiftUI
import ExpoModulesCore

/**
 * Updates controller for applications that have updates enabled and properly-configured.
 */
public class EnabledAppController: UpdatesStateChangeDelegate, InternalAppControllerInterface, StartupProcedureDelegate {
  private static let ErrorDomain = "EXUpdatesAppController"

  public weak var delegate: AppControllerDelegate?
  public weak var appContext: AppContext?

  internal let config: UpdatesConfig
  private let database: UpdatesDatabase

  public let updatesDirectory: URL? // internal for E2E test
  private let updatesDirectoryInternal: URL
  private let controllerQueue = DispatchQueue(label: "expo.controller.ControllerQueue")
  public let isActiveController = true
  public private(set) var isStarted = false

  public var shouldEmitJsEvents = false {
    didSet {
      if shouldEmitJsEvents == true {
        sendQueuedEventsToAppContext()
      }
    }
  }

  private var eventsToSendToJS: [[String: Any?]] = []

  private let stateMachine = UpdatesStateMachine(validUpdatesStateValues: Set(UpdatesStateValue.allCases))

  private let selectionPolicy: SelectionPolicy

  private let logger = UpdatesLogger()

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

    self.stateMachine.changeEventDelegate = self
  }

  public func start() {
    precondition(!isStarted, "AppController:start should only be called once per instance")

    isStarted = true

    purgeUpdatesLogsOlderThanOneDay()

    UpdatesBuildData.ensureBuildDataIsConsistentAsync(database: database, config: config)

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

  // MARK: - StartupProcedureDelegate

  func startupProcedureDidLaunch(_ startupProcedure: StartupProcedure) {
    delegate.let { _ in
      DispatchQueue.main.async { [weak self] in
        if let strongSelf = self {
          strongSelf.delegate?.appController(strongSelf, didStartWithSuccess: strongSelf.startupProcedure.launchAssetUrl() != nil)
          strongSelf.sendQueuedEventsToAppContext()
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
    UpdatesUtils.purgeUpdatesLogsOlderThanOneDay()
  }

  // MARK: - Send events to JS

  internal func sendUpdateStateChangeEventToAppContext(_ eventType: UpdatesStateEventType, body: [String: Any?]) {
    logger.info(message: "sendUpdateStateChangeEventToAppContext(): type = \(eventType)")
    sendEventToAppContext(EXUpdatesStateChangeEventName, "\(eventType)", body: body)
  }

  private func sendEventToAppContext(_ eventName: String, _ eventType: String, body: [String: Any?]) {
    var mutableBody = body
    mutableBody["type"] = eventType

    guard let appContext = appContext,
      let eventEmitter = appContext.eventEmitter,
      shouldEmitJsEvents == true else {
      eventsToSendToJS.append([
        "eventName": eventName,
        "mutableBody": mutableBody
      ])
      logger.warn(message: "EXUpdates: Could not emit event: name = \(eventName), type = \(eventType). Event will be emitted when the appContext is available", code: .jsRuntimeError)
      return
    }
    logger.debug(message: "sendEventToAppContext: \(eventName), \(mutableBody)")
    eventEmitter.sendEvent(withName: eventName, body: mutableBody)
  }

  internal func sendQueuedEventsToAppContext() {
    guard let appContext = appContext,
      let eventEmitter = appContext.eventEmitter,
      shouldEmitJsEvents == true else {
      return
    }
    eventsToSendToJS.forEach { event in
      guard let eventName = event["eventName"] as? String,
        let mutableBody = event["mutableBody"] as? [String: Any?] else {
        return
      }
      logger.debug(message: "sendEventToAppContext: \(eventName), \(mutableBody)")
      eventEmitter.sendEvent(withName: eventName, body: mutableBody)
    }
    eventsToSendToJS = []
  }

  // MARK: - JS API

  public func getConstantsForModule() -> UpdatesModuleConstants {
    return UpdatesModuleConstants(
      launchedUpdate: startupProcedure.launchedUpdate(),
      embeddedUpdate: getEmbeddedUpdate(),
      emergencyLaunchException: startupProcedure.emergencyLaunchException,
      isEnabled: true,
      isUsingEmbeddedAssets: startupProcedure.isUsingEmbeddedAssets(),
      runtimeVersion: self.config.runtimeVersion,
      checkOnLaunch: self.config.checkOnLaunch,
      requestHeaders: self.config.requestHeaders,
      assetFilesMap: startupProcedure.assetFilesMap(),
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: false
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

// swiftlint:enable force_unwrapping
