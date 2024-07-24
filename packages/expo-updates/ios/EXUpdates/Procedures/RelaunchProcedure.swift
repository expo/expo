//  Copyright © 2019 650 Industries. All rights reserved.

import React
import ExpoModulesCore

final class RelaunchProcedure: StateMachineProcedure {
  private let database: UpdatesDatabase
  private let config: UpdatesConfig
  private let selectionPolicy: SelectionPolicy
  private let controllerQueue: DispatchQueue
  private let updatesDirectory: URL
  private let logger: UpdatesLogger
  private let shouldRunReaper: Bool
  private let triggerReloadCommandListenersReason: String
  private let getLaunchedUpdate: () -> Update?
  private let setLauncher: (_ newLauncher: AppLauncher) -> Void
  private let requestStartErrorMonitoring: () -> Void
  private let successBlock: () -> Void
  private let errorBlock: (_ error: Exception) -> Void

  init(
    database: UpdatesDatabase,
    config: UpdatesConfig,
    selectionPolicy: SelectionPolicy,
    controllerQueue: DispatchQueue,
    updatesDirectory: URL,
    logger: UpdatesLogger,
    shouldRunReaper: Bool,
    triggerReloadCommandListenersReason: String,
    getLaunchedUpdate: @escaping () -> Update?,
    setLauncher: @escaping (_ setCurrentLauncher: AppLauncher) -> Void,
    requestStartErrorMonitoring: @escaping () -> Void,
    successBlock: @escaping () -> Void,
    errorBlock: @escaping (_: Exception) -> Void
  ) {
    self.database = database
    self.config = config
    self.selectionPolicy = selectionPolicy
    self.controllerQueue = controllerQueue
    self.updatesDirectory = updatesDirectory
    self.logger = logger
    self.shouldRunReaper = shouldRunReaper
    self.triggerReloadCommandListenersReason = triggerReloadCommandListenersReason
    self.getLaunchedUpdate = getLaunchedUpdate
    self.setLauncher = setLauncher
    self.requestStartErrorMonitoring = requestStartErrorMonitoring
    self.successBlock = successBlock
    self.errorBlock = errorBlock
  }

  func getLoggerTimerLabel() -> String {
    "timer-relaunch"
  }

  func run(procedureContext: ProcedureContext) {
    procedureContext.processStateEvent(UpdatesStateEventRestart())
    let launcherWithDatabase = AppLauncherWithDatabase(
      config: config,
      database: database,
      directory: updatesDirectory,
      completionQueue: controllerQueue
    )
    launcherWithDatabase.launchUpdate(withSelectionPolicy: selectionPolicy) { error, success in
      if success {
        self.setLauncher(launcherWithDatabase)
        self.requestStartErrorMonitoring()
        RCTReloadCommandSetBundleURL(launcherWithDatabase.launchAssetUrl)
        RCTTriggerReloadCommandListeners(self.triggerReloadCommandListenersReason)

        // TODO(wschurman): this was moved to after the RCT calls to unify reload
        // code between JS API call and error recovery handler. double check that
        // this is okay
        self.successBlock()

        if self.shouldRunReaper {
          self.runReaper()
        }

        // Reset the state machine
        procedureContext.resetState()
        procedureContext.onComplete()
      } else {
        // swiftlint:disable:next force_unwrapping
        NSLog("Failed to relaunch: %@", error!.localizedDescription)
        self.errorBlock(UpdatesReloadException())
        procedureContext.onComplete()
      }
    }
  }

  private func runReaper() {
    if let launchedUpdate = getLaunchedUpdate() {
      UpdatesReaper.reapUnusedUpdates(
        withConfig: config,
        database: database,
        directory: updatesDirectory,
        selectionPolicy: selectionPolicy,
        launchedUpdate: launchedUpdate
      )
    }
  }
}
