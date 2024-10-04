//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length
// swiftlint:disable function_parameter_count

import Foundation

/**
 * Subclass of AppLoader which handles downloading updates from a remote server.
 */
public final class RemoteAppLoader: AppLoader {
  private static let ErrorDomain = "EXUpdatesRemoteAppLoader"

  private let downloader: FileDownloader
  private var remoteUpdateResponse: UpdateResponse?
  private let completionQueue: DispatchQueue

  public required override init(
    config: UpdatesConfig,
    database: UpdatesDatabase,
    directory: URL,
    launchedUpdate: Update?,
    completionQueue: DispatchQueue
  ) {
    self.downloader = FileDownloader(config: config)
    self.completionQueue = completionQueue
    super.init(config: config, database: database, directory: directory, launchedUpdate: launchedUpdate, completionQueue: completionQueue)
  }

  override public func loadUpdate(
    fromURL url: URL,
    onUpdateResponse updateResponseBlockArg: @escaping AppLoaderUpdateResponseBlock,
    asset assetBlockArg: @escaping AppLoaderAssetBlock,
    success successBlockArg: @escaping AppLoaderSuccessBlock,
    error errorBlockArg: @escaping AppLoaderErrorBlock
  ) {
    self.updateResponseBlock = updateResponseBlockArg
    self.assetBlock = assetBlockArg
    self.errorBlock = errorBlockArg

    self.successBlock = { [weak self] (updateResponse: UpdateResponse?) in
      guard let strongSelf = self else {
        successBlockArg(updateResponse)
        return
      }
      // even if update is nil (meaning we didn't load a new update),
      // we want to persist the header data from remoteUpdateResponse
      if let remoteUpdateResponse = strongSelf.remoteUpdateResponse,
        let responseHeaderData = remoteUpdateResponse.responseHeaderData {
        strongSelf.database.databaseQueue.async {
          do {
            try strongSelf.database.setMetadata(withResponseHeaderData: responseHeaderData, scopeKey: strongSelf.config.scopeKey)
            successBlockArg(updateResponse)
          } catch {
            NSLog("Error persisting header data to disk: %@", error.localizedDescription)
            errorBlockArg(error)
          }
        }
      } else {
        successBlockArg(updateResponse)
      }
    }

    database.databaseQueue.async {
      let embeddedUpdate = EmbeddedAppLoader.embeddedManifest(withConfig: self.config, database: self.database)
      let extraHeaders = FileDownloader.extraHeadersForRemoteUpdateRequest(
        withDatabase: self.database,
        config: self.config,
        launchedUpdate: self.launchedUpdate,
        embeddedUpdate: embeddedUpdate
      )
      self.downloader.downloadRemoteUpdate(
        fromURL: url,
        withDatabase: self.database,
        extraHeaders: extraHeaders
      ) { updateResponse in
        self.remoteUpdateResponse = updateResponse
        self.startLoading(fromUpdateResponse: updateResponse)
      } errorBlock: { error in
        self.errorBlock.let { it in
          it(error)
        }
      }
    }
  }

  override public func downloadAsset(_ asset: UpdateAsset) {
    let urlOnDisk = self.directory.appendingPathComponent(asset.filename)

    FileDownloader.assetFilesQueue.async {
      if FileManager.default.fileExists(atPath: urlOnDisk.path) {
        // file already exists, we don't need to download it again
        DispatchQueue.global().async {
          self.handleAssetDownloadAlreadyExists(asset)
        }
      } else {
        guard let assetUrl = asset.url else {
          self.handleAssetDownload(
            withError: NSError(
              domain: RemoteAppLoader.ErrorDomain,
              code: 1006,
              userInfo: [
                NSLocalizedDescriptionKey: "Failed to download asset with no URL provided"
              ]
            ),
            asset: asset
          )
          return
        }

        self.downloader.downloadFile(
          fromURL: assetUrl,
          verifyingHash: asset.expectedHash,
          toPath: urlOnDisk.path,
          extraHeaders: asset.extraRequestHeaders ?? [:]
        ) { data, response, _ in
          DispatchQueue.global().async {
            self.handleAssetDownload(withData: data, response: response, asset: asset)
          }
        } errorBlock: { error in
          DispatchQueue.global().async {
            self.handleAssetDownload(withError: error, asset: asset)
          }
        }
      }
    }
  }

  static func processSuccessLoaderResult(
    config: UpdatesConfig,
    database: UpdatesDatabase,
    selectionPolicy: SelectionPolicy,
    launchedUpdate: Update?,
    directory: URL,
    loaderTaskQueue: DispatchQueue,
    updateResponse: UpdateResponse?,
    priorError: Error?,
    onComplete: @escaping (_ updateToLaunch: Update?, _ error: Error?, _ didRollBackToEmbedded: Bool) -> Void
  ) {
    let updateBeingLaunched = updateResponse?.manifestUpdateResponsePart?.updateManifest

    if let rollBackDirective = updateResponse?.directiveUpdateResponsePart?.updateDirective as? RollBackToEmbeddedUpdateDirective {
      self.processRollBackToEmbeddedDirective(
        config: config,
        database: database,
        selectionPolicy: selectionPolicy,
        launchedUpdate: launchedUpdate,
        directory: directory,
        loaderTaskQueue: loaderTaskQueue,
        rollBackDirective: rollBackDirective,
        manifestFilters: updateResponse?.responseHeaderData?.manifestFilters,
        priorError: priorError,
        onComplete: onComplete
      )
    } else {
      onComplete(updateBeingLaunched, priorError, false)
    }
  }

  /**
   * If directive is to roll-back to the embedded update and there is an embedded update,
   * we need to update embedded update in the DB with the newer commitTime from the message so that
   * the selection policy will choose it. That way future updates can continue to be applied
   * over this roll back, but older ones won't.
   * The embedded update is guaranteed to be in the DB from the earlier [EmbeddedAppLoader] call in this task.
   */
  private static func processRollBackToEmbeddedDirective(
    config: UpdatesConfig,
    database: UpdatesDatabase,
    selectionPolicy: SelectionPolicy,
    launchedUpdate: Update?,
    directory: URL,
    loaderTaskQueue: DispatchQueue,
    rollBackDirective: RollBackToEmbeddedUpdateDirective,
    manifestFilters: [String: Any]?,
    priorError: Error?,
    onComplete: @escaping (_ updateToLaunch: Update?, _ error: Error?, _ didRollBackToEmbedded: Bool) -> Void
  ) {
    if !config.hasEmbeddedUpdate {
      onComplete(nil, priorError, false)
      return
    }

    guard let embeddedManifest = EmbeddedAppLoader.embeddedManifest(withConfig: config, database: database) else {
      onComplete(nil, priorError, false)
      return
    }

    if !selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
      rollBackDirective,
      withEmbeddedUpdate: embeddedManifest,
      launchedUpdate: launchedUpdate,
      filters: manifestFilters
    ) {
      onComplete(nil, priorError, false)
      return
    }

    // update the embedded update commit time in the in-memory embedded update since it is a singleton
    embeddedManifest.commitTime = rollBackDirective.commitTime

    EmbeddedAppLoader(
      config: config,
      database: database,
      directory: directory,
      launchedUpdate: nil,
      completionQueue: loaderTaskQueue
    ).loadUpdateResponseFromEmbeddedManifest(
      withCallback: { _ in
        return true
      }, asset: { _, _, _, _ in
      }, success: { updateResponse in
        do {
          let update = updateResponse?.manifestUpdateResponsePart?.updateManifest
          // do this synchronously as it is needed to launch, and we're already on a background dispatch queue so no UI will be blocked
          try database.databaseQueue.sync {
            // swiftlint:disable force_unwrapping
            try database.setUpdateCommitTime(rollBackDirective.commitTime, onUpdate: update!)
            // swiftlint:enable force_unwrapping
          }
          onComplete(update, priorError, true)
        } catch {
          onComplete(nil, error, false)
        }
      }, error: { embeddedLoaderError in
        onComplete(nil, embeddedLoaderError, false)
      }
    )
  }
}

// swiftlint:enable function_parameter_count
