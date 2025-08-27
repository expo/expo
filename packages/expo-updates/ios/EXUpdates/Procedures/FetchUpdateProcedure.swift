//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length

import ExpoModulesCore

final class FetchUpdateProcedure: StateMachineProcedure {
  private let database: UpdatesDatabase
  private let config: UpdatesConfig
  private let selectionPolicy: SelectionPolicy
  private let controllerQueue: DispatchQueue
  private let updatesDirectory: URL
  private let logger: UpdatesLogger
  private let getLaunchedUpdate: () -> Update?
  private let successBlock: (_ fetchUpdateResult: FetchUpdateResult) -> Void
  private let errorBlock: (_ error: Exception) -> Void

  private let remoteAppLoader: RemoteAppLoader

  init(
    database: UpdatesDatabase,
    config: UpdatesConfig,
    selectionPolicy: SelectionPolicy,
    controllerQueue: DispatchQueue,
    updatesDirectory: URL,
    logger: UpdatesLogger,
    getLaunchedUpdate: @escaping () -> Update?,
    successBlock: @escaping (_: FetchUpdateResult) -> Void,
    errorBlock: @escaping (_: Exception) -> Void
  ) {
    self.database = database
    self.config = config
    self.selectionPolicy = selectionPolicy
    self.controllerQueue = controllerQueue
    self.updatesDirectory = updatesDirectory
    self.logger = logger
    self.getLaunchedUpdate = getLaunchedUpdate
    self.successBlock = successBlock
    self.errorBlock = errorBlock

    self.remoteAppLoader = RemoteAppLoader(
      config: self.config,
      logger: self.logger,
      database: self.database,
      directory: self.updatesDirectory,
      launchedUpdate: self.getLaunchedUpdate(),
      completionQueue: controllerQueue
    )
  }

  func getLoggerTimerLabel() -> String {
    "timer-fetch-update"
  }

  func run(procedureContext: ProcedureContext) {
    procedureContext.processStateEvent(.download)
    remoteAppLoader.assetLoadProgressBlock = { progress in
      procedureContext.processStateEvent(.downloadProgress(progress: progress))
    }
    remoteAppLoader.loadUpdate(
      fromURL: self.config.updateUrl
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

      return self.selectionPolicy.shouldLoadNewUpdate(
        update,
        withLaunchedUpdate: self.getLaunchedUpdate(),
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
      self.logger.info(
        message: "fetchUpdateAsync didLoadAsset: \(body)",
        code: .none,
        updateId: nil,
        assetId: asset.contentHash
      )
    } success: { updateResponse in
      RemoteAppLoader.processSuccessLoaderResult(
        config: self.config,
        logger: self.logger,
        database: self.database,
        selectionPolicy: self.selectionPolicy,
        launchedUpdate: self.getLaunchedUpdate(),
        directory: self.updatesDirectory,
        loaderTaskQueue: DispatchQueue(label: "expo.loader.LoaderTaskQueue"),
        updateResponse: updateResponse,
        priorError: nil
      ) { updateToLaunch, error, didRollBackToEmbedded in
        if let error = error {
          procedureContext.processStateEvent(.downloadError(errorMessage: error.localizedDescription))
          self.successBlock(FetchUpdateResult.error(error: error))
          procedureContext.onComplete()
          return
        }

        if didRollBackToEmbedded {
          self.successBlock(FetchUpdateResult.rollBackToEmbedded)
          procedureContext.processStateEvent(.downloadComplete)
          procedureContext.onComplete()
          return
        }

        if let update = updateToLaunch {
          self.successBlock(FetchUpdateResult.success(manifest: update.manifest.rawManifestJSON()))
          procedureContext.processStateEvent(.downloadCompleteWithUpdate(manifest: update.manifest.rawManifestJSON()))
          procedureContext.onComplete()
          return
        }

        self.successBlock(FetchUpdateResult.failure)
        procedureContext.processStateEvent(.downloadComplete)
        procedureContext.onComplete()
        return
      }
    } error: { error in
      procedureContext.processStateEvent(.downloadError(errorMessage: error.localizedDescription))
      self.successBlock(FetchUpdateResult.error(error: error))
      procedureContext.onComplete()
      return
    }
  }
}

// swiftlint:enable closure_body_length
