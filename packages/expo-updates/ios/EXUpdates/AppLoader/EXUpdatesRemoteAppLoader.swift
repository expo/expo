//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length

import Foundation

/**
 * Subclass of EXUpdatesAppLoader which handles downloading updates from a remote server.
 */
internal final class EXUpdatesRemoteAppLoader: EXUpdatesAppLoader {
  private static let EXUpdatesRemoteAppLoaderErrorDomain = "EXUpdatesRemoteAppLoader"

  private let downloader: EXUpdatesFileDownloader
  private var remoteUpdate: EXUpdatesUpdate?
  private let completionQueue: DispatchQueue

  public required init(
    config: EXUpdatesConfig,
    database: EXUpdatesDatabase,
    directory: URL,
    launchedUpdate: EXUpdatesUpdate?,
    completionQueue: DispatchQueue
  ) {
    self.downloader = EXUpdatesFileDownloader(config: config)
    self.completionQueue = completionQueue
    super.init(config: config, database: database, directory: directory, launchedUpdate: launchedUpdate, completionQueue: completionQueue)
  }

  override public func loadUpdate(
    fromURL url: URL,
    onManifest manifestBlockArg: @escaping EXUpdatesAppLoaderManifestBlock,
    asset assetBlockArg: @escaping EXUpdatesAppLoaderAssetBlock,
    success successBlockArg: @escaping EXUpdatesAppLoaderSuccessBlock,
    error errorBlockArg: @escaping EXUpdatesAppLoaderErrorBlock
  ) {
    self.manifestBlock = manifestBlockArg
    self.assetBlock = assetBlockArg
    self.errorBlock = errorBlockArg

    self.successBlock = { [weak self] (update: EXUpdatesUpdate?) in
      guard let strongSelf = self else {
        return
      }
      // even if update is nil (meaning we didn't load a new update),
      // we want to persist the header data from _remoteUpdate
      if let remoteUpdate = strongSelf.remoteUpdate {
        strongSelf.database.databaseQueue.async {
          do {
            try strongSelf.database.setMetadata(withManifest: remoteUpdate)
            successBlockArg(update)
          } catch {
            NSLog("Error persisting header data to disk: %@", error.localizedDescription)
            errorBlockArg(error)
          }
        }
      } else {
        successBlockArg(update)
      }
    }

    database.databaseQueue.async {
      let embeddedUpdate = EXUpdatesEmbeddedAppLoader.embeddedManifest(withConfig: self.config, database: self.database)
      let extraHeaders = EXUpdatesFileDownloader.extraHeaders(
        withDatabase: self.database,
        config: self.config,
        launchedUpdate: self.launchedUpdate,
        embeddedUpdate: embeddedUpdate
      )
      self.downloader.downloadManifest(
        fromURL: url,
        withDatabase: self.database,
        extraHeaders: extraHeaders
      ) { update in
        self.remoteUpdate = update
        self.startLoading(fromManifest: update)
      } errorBlock: { error in
        self.errorBlock.let { it in
          it(error)
        }
      }
    }
  }

  override public func downloadAsset(_ asset: EXUpdatesAsset) {
    let urlOnDisk = self.directory.appendingPathComponent(asset.filename)

    EXUpdatesFileDownloader.assetFilesQueue.async {
      if FileManager.default.fileExists(atPath: urlOnDisk.path) {
        // file already exists, we don't need to download it again
        DispatchQueue.global().async {
          self.handleAssetDownloadAlreadyExists(asset)
        }
      } else {
        guard let assetUrl = asset.url else {
          self.handleAssetDownload(
            withError: NSError(
              domain: EXUpdatesRemoteAppLoader.EXUpdatesRemoteAppLoaderErrorDomain,
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
}
