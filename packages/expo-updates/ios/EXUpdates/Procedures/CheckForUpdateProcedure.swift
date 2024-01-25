//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length

import ExpoModulesCore

final class CheckForUpdateProcedure: StateMachineProcedure {
  private let database: UpdatesDatabase
  private let config: UpdatesConfig
  private let selectionPolicy: SelectionPolicy
  private let logger: UpdatesLogger
  private let getLaunchedUpdate: () -> Update?
  private let successBlock: (_ checkForUpdateResult: CheckForUpdateResult) -> Void
  private let errorBlock: (_ error: Exception) -> Void

  init(
    database: UpdatesDatabase,
    config: UpdatesConfig,
    selectionPolicy: SelectionPolicy,
    logger: UpdatesLogger,
    getLaunchedUpdate: @escaping () -> Update?,
    successBlock: @escaping (_: CheckForUpdateResult) -> Void,
    errorBlock: @escaping (_: Exception) -> Void
  ) {
    self.database = database
    self.config = config
    self.selectionPolicy = selectionPolicy
    self.logger = logger
    self.getLaunchedUpdate = getLaunchedUpdate
    self.successBlock = successBlock
    self.errorBlock = errorBlock
  }

  func getLoggerTimerLabel() -> String {
    "timer-check-for-update"
  }

  func run(procedureContext: ProcedureContext) {
    procedureContext.processStateEvent(UpdatesStateEventCheck())

    database.databaseQueue.async {
      let embeddedUpdate = EmbeddedAppLoader.embeddedManifest(withConfig: self.config, database: self.database)
      let extraHeaders = FileDownloader.extraHeadersForRemoteUpdateRequest(
        withDatabase: self.database,
        config: self.config,
        launchedUpdate: self.getLaunchedUpdate(),
        embeddedUpdate: embeddedUpdate
      )

      FileDownloader(config: self.config).downloadRemoteUpdate(
        fromURL: self.config.updateUrl,
        withDatabase: self.database,
        extraHeaders: extraHeaders) { updateResponse in
          let launchedUpdate = self.getLaunchedUpdate()
          let manifestFilters = updateResponse.responseHeaderData?.manifestFilters

          if let updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective {
            switch updateDirective {
            case is NoUpdateAvailableUpdateDirective:
              self.successBlock(CheckForUpdateResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.noUpdateAvailableOnServer))
              procedureContext.processStateEvent(UpdatesStateEventCheckComplete())
              procedureContext.onComplete()
              return
            case let rollBackUpdateDirective as RollBackToEmbeddedUpdateDirective:
              if !self.config.hasEmbeddedUpdate {
                self.successBlock(CheckForUpdateResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.rollbackNoEmbedded))
                procedureContext.processStateEvent(UpdatesStateEventCheckComplete())
                procedureContext.onComplete()
                return
              }

              guard let embeddedUpdate = embeddedUpdate else {
                self.successBlock(CheckForUpdateResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.rollbackNoEmbedded))
                procedureContext.processStateEvent(UpdatesStateEventCheckComplete())
                procedureContext.onComplete()
                return
              }

              if !self.selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
                rollBackUpdateDirective,
                withEmbeddedUpdate: embeddedUpdate,
                launchedUpdate: launchedUpdate,
                filters: manifestFilters
              ) {
                self.successBlock(CheckForUpdateResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.rollbackRejectedBySelectionPolicy))
                procedureContext.processStateEvent(UpdatesStateEventCheckComplete())
                procedureContext.onComplete()
                return
              }

              self.successBlock(CheckForUpdateResult.rollBackToEmbedded(commitTime: rollBackUpdateDirective.commitTime))
              procedureContext.processStateEvent(
                UpdatesStateEventCheckCompleteWithRollback(rollbackCommitTime: rollBackUpdateDirective.commitTime)
              )
              procedureContext.onComplete()
              return
            default:
              assertionFailure("Unhandled directive type")
            }
          }

          guard let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
            self.successBlock(CheckForUpdateResult.noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason.noUpdateAvailableOnServer))
            procedureContext.processStateEvent(UpdatesStateEventCheckComplete())
            procedureContext.onComplete()
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
            self.successBlock(CheckForUpdateResult.updateAvailable(manifest: update.manifest.rawManifestJSON()))
            procedureContext.processStateEvent(UpdatesStateEventCheckCompleteWithUpdate(manifest: update.manifest.rawManifestJSON()))
            procedureContext.onComplete()
            return
          }

          let reason = failedPreviously ?
            RemoteCheckResultNotAvailableReason.updatePreviouslyFailed :
            RemoteCheckResultNotAvailableReason.updateRejectedBySelectionPolicy
          self.successBlock(CheckForUpdateResult.noUpdateAvailable(reason: reason))
          procedureContext.processStateEvent(UpdatesStateEventCheckComplete())
          procedureContext.onComplete()
          return
        } errorBlock: { error in
          procedureContext.processStateEvent(UpdatesStateEventCheckError(message: error.localizedDescription))
          self.successBlock(CheckForUpdateResult.error(error: error))
          procedureContext.onComplete()
          return
      }
    }
  }
}

// swiftlint:enable closure_body_length
