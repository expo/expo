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
  private let reloadScreenManager: Reloadable?
  private let triggerReloadCommandListenersReason: String
  private let getLaunchedUpdate: () -> Update?
  private let setLauncher: (_ newLauncher: AppLauncher) -> Void
  private let requestStartErrorMonitoring: () -> Void
  private let successBlock: () -> Void
  private let errorBlock: (_ error: Exception) -> Void

  private let launcherWithDatabase: AppLauncherWithDatabase

  init(
    database: UpdatesDatabase,
    config: UpdatesConfig,
    selectionPolicy: SelectionPolicy,
    controllerQueue: DispatchQueue,
    updatesDirectory: URL,
    logger: UpdatesLogger,
    shouldRunReaper: Bool,
    triggerReloadCommandListenersReason: String,
    reloadScreenManager: Reloadable?,
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
    self.reloadScreenManager = reloadScreenManager
    self.getLaunchedUpdate = getLaunchedUpdate
    self.setLauncher = setLauncher
    self.requestStartErrorMonitoring = requestStartErrorMonitoring
    self.successBlock = successBlock
    self.errorBlock = errorBlock

    self.launcherWithDatabase = AppLauncherWithDatabase(
      config: config,
      database: database,
      directory: updatesDirectory,
      completionQueue: controllerQueue,
      logger: self.logger
    )
  }

  func getLoggerTimerLabel() -> String {
    "timer-relaunch"
  }

  func run(procedureContext: ProcedureContext) {
    procedureContext.processStateEvent(.restart)
    launcherWithDatabase.launchUpdate(withSelectionPolicy: selectionPolicy) { error, success in
      DispatchQueue.main.async {
        if success {
          self.setLauncher(self.launcherWithDatabase)
          self.requestStartErrorMonitoring()
          RCTReloadCommandSetBundleURL(self.launcherWithDatabase.launchAssetUrl)
          RCTTriggerReloadCommandListeners(self.triggerReloadCommandListenersReason)

          self.reloadScreenManager?.show()

          // TODO(wschurman): this was moved to after the RCT calls to unify reload
          // code between JS API call and error recovery handler. double check that
          // this is okay
          self.successBlock()

          if self.shouldRunReaper {
            self.runReaper()
          }

          // Reset the state machine
          procedureContext.resetStateAfterRestart()
          procedureContext.onComplete()
        } else {
          // swiftlint:disable:next force_unwrapping
          self.logger.error(cause: UpdatesError.relaunchProcedureFailedToRelaunch(cause: error!))
          self.errorBlock(UpdatesReloadException())
          procedureContext.onComplete()
        }
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
        launchedUpdate: launchedUpdate,
        logger: self.logger
      )
    }
  }
}
