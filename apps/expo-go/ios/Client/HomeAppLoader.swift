// Copyright 2015-present 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length

import Foundation
import EXUpdates
import EXManifests

/**
 An AppLoader implementation that starts with an already existing manifest and is only responsible
 for downloading assets, primarily the bundle.
 */
final class HomeAppLoader: AppLoader {
  private static let ErrorDomain = "HomeAppLoader"

  private let manifestAndAssetRequestHeaders: ManifestAndAssetRequestHeaders

  private let downloader: FileDownloader
  private let completionQueue: DispatchQueue

  required init(
    manifestAndAssetRequestHeaders: ManifestAndAssetRequestHeaders,
    config: UpdatesConfig,
    logger: UpdatesLogger,
    database: UpdatesDatabase,
    directory: URL,
    launchedUpdate: Update?,
    completionQueue: DispatchQueue
  ) {
    self.manifestAndAssetRequestHeaders = manifestAndAssetRequestHeaders
    self.downloader = FileDownloader(config: config)
    self.completionQueue = completionQueue
    super.init(config: config, logger: logger, database: database, directory: directory, launchedUpdate: launchedUpdate, completionQueue: completionQueue)
  }

  func loadHome(
    onUpdateResponse updateResponseBlockArg: @escaping AppLoaderUpdateResponseBlock,
    asset assetBlockArg: @escaping AppLoaderAssetBlock,
    success successBlockArg: @escaping AppLoaderSuccessBlock,
    error errorBlockArg: @escaping AppLoaderErrorBlock
  ) {
    self.updateResponseBlock = updateResponseBlockArg
    self.assetBlock = assetBlockArg
    self.errorBlock = errorBlockArg
    self.successBlock = successBlockArg

    database.databaseQueue.async {
      let update: Update
      if let manifest = self.manifestAndAssetRequestHeaders.manifest as? ExpoUpdatesManifest {
        update = ExpoUpdatesUpdate.update(
          withExpoUpdatesManifest: manifest,
          extensions: ["assetRequestHeaders": self.manifestAndAssetRequestHeaders.assetRequestHeaders],
          config: self.config,
          database: self.database
        )
      } else {
        // swiftlint:disable force_cast
        update = EmbeddedUpdate.update(
          withEmbeddedManifest: self.manifestAndAssetRequestHeaders.manifest as! EmbeddedManifest,
          config: self.config,
          database: self.database
        )
        // swiftlint:enable force_cast
      }

      self.startLoading(fromUpdateResponse: UpdateResponse(
        responseHeaderData: nil,
        manifestUpdateResponsePart: ManifestUpdateResponsePart(updateManifest: update),
        directiveUpdateResponsePart: nil
      ))
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
            withError: UpdatesError.remoteAppLoaderAssetMissingUrl,
            asset: asset
          )
          return
        }

        self.downloader.downloadAsset(
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

// swiftlint:enable closure_body_length
