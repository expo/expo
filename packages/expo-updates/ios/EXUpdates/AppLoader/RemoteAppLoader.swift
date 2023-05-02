//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length

import Foundation

/**
 * Subclass of AppLoader which handles downloading updates from a remote server.
 */
internal final class RemoteAppLoader: AppLoader {
  private static let ErrorDomain = "EXUpdatesRemoteAppLoader"

  private let downloader: FileDownloader
  private var remoteUpdateResponse: UpdateResponse?
  private let completionQueue: DispatchQueue

  required init(
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

  override func loadUpdate(
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
            // swiftlint:disable:next force_unwrapping
            try strongSelf.database.setMetadata(withResponseHeaderData: responseHeaderData, scopeKey: strongSelf.config.scopeKey!)
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

  override func downloadAsset(_ asset: UpdateAsset) {
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
}
