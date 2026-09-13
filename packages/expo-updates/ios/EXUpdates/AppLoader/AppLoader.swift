//  Copyright © 2019 650 Industries. All rights reserved.

// this uses abstract class patterns
// swiftlint:disable unavailable_function

// swiftlint:disable closure_body_length

// this class uses a lot of implicit non-null stuff across function calls. not worth refactoring to just satisfy lint
// swiftlint:disable force_unwrapping

import Foundation

public typealias AppLoaderUpdateResponseBlock = (_ updateResponse: UpdateResponse) -> Bool
public typealias AppLoaderAssetBlock = (_ asset: UpdateAsset, _ successfulAssetCount: Int, _ failedAssetCount: Int, _ totalAssetCount: Int) -> Void
public typealias AppLoaderSuccessBlock = (_ updateResponse: UpdateResponse?) -> Void
public typealias AppLoaderErrorBlock = (_ error: UpdatesError) -> Void

/**
 * Responsible for loading an update's manifest, enumerating the assets required for it to launch,
 * and loading them all onto disk and into SQLite.
 *
 * There are two sources from which an update can be loaded - a remote server given a URL, and the
 * application package. These correspond to the two loader subclasses.
 */
@objc(EXUpdatesAppLoader)
@objcMembers
open class AppLoader: NSObject {
  public let config: UpdatesConfig
  public let logger: UpdatesLogger
  public let database: UpdatesDatabase
  public let directory: URL
  public let launchedUpdate: Update?
  public var requestedUpdate: Update?

  private var updateResponseContainingManifest: UpdateResponse?

  public var updateResponseBlock: AppLoaderUpdateResponseBlock?
  public var assetBlock: AppLoaderAssetBlock?
  public var assetLoadProgressBlock: FileDownloadProgressBlock?
  public var successBlock: AppLoaderSuccessBlock?
  public var errorBlock: AppLoaderErrorBlock?

  private var assetsToLoad: [UpdateAsset] = []
  private var assetDownloadProgress: [UpdateAsset: Double] = [:]
  private var erroredAssets: [UpdateAsset] = []
  private var finishedAssets: [UpdateAsset] = []
  private var existingAssets: [UpdateAsset] = []

  private let arrayLock: NSLock = NSLock()
  private let completionQueue: DispatchQueue

  /// Overridable for testing, where the bundle has no `app.manifest`.
  internal lazy var embeddedUpdate: Update? = EmbeddedAppLoader.embeddedManifest(withConfig: config, database: database)

  /// Overridable for testing, where fixtures live in the test bundle rather than in `updatesBundle`.
  internal var embeddedAssetsBundle: Bundle = updatesBundle

  /// Whether an asset with no database row may be copied out of the app binary rather than
  /// downloaded. Only remote loads have anything to reuse.
  internal var reusesEmbeddedAssets: Bool { true }

  public init(
    config: UpdatesConfig,
    logger: UpdatesLogger,
    database: UpdatesDatabase,
    directory: URL,
    launchedUpdate: Update?,
    completionQueue: DispatchQueue
  ) {
    self.config = config
    self.logger = logger
    self.database = database
    self.directory = directory
    self.launchedUpdate = launchedUpdate
    self.completionQueue = completionQueue
  }

  public func reset() {
    assetsToLoad = []
    erroredAssets = []
    finishedAssets = []
    existingAssets = []
    assetDownloadProgress = [:]
    updateResponseContainingManifest = nil
    requestedUpdate = nil
    updateResponseBlock = nil
    assetBlock = nil
    successBlock = nil
    errorBlock = nil
    assetLoadProgressBlock = nil
  }

  // MARK: - abstract methods

  /**
   * Load an update from the given URL, which should respond with a valid manifest.
   *
   * The `updateResponseBlock` block is called as soon as the update response has been downloaded.
   * The block should determine whether or not the update described by this update response
   * should be downloaded, based on (for example) whether or not it already has the
   * update downloaded locally, and return the corresponding BOOL value.
   *
   * The `asset` block is called when an asset has either been successfully downloaded
   * or failed to download.
   */
  open func loadUpdate(
    fromURL url: URL,
    onUpdateResponse updateResponseBlock: @escaping AppLoaderUpdateResponseBlock,
    asset assetBlock: @escaping AppLoaderAssetBlock,
    success successBlock: @escaping AppLoaderSuccessBlock,
    error errorBlock: @escaping AppLoaderErrorBlock
  ) {
    preconditionFailure("Must override in concrete class")
  }

  open func downloadAsset(_ asset: UpdateAsset, extraHeaders: [String: Any]) {
    preconditionFailure("Must override in concrete class")
  }

  // MARK: - loading and database logic

  public func startLoading(fromUpdateResponse updateResponse: UpdateResponse) {
    guard shouldStartLoadingUpdate(updateResponse) else {
      successBlock.let { it in
        completionQueue.async {
          it(nil)
        }
      }
      return
    }

    guard let updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest else {
      successBlock.let { it in
        completionQueue.async {
          it(updateResponse)
        }
      }
      return
    }

    if updateManifest.isDevelopmentMode {
      database.databaseQueue.async {
        do {
          try self.database.addUpdate(updateManifest, config: self.config)
          try self.database.markUpdateFinished(updateManifest)
        } catch {
          self.finish(withError: UpdatesError.appLoaderUnknownError(cause: error))
          return
        }

        let successBlock = self.successBlock
        self.completionQueue.async {
          successBlock.let { it in
            it(updateResponse)
          }
          self.reset()
        }
      }
      return
    }

    database.databaseQueue.async {
      var existingUpdateError: Error?
      var existingUpdate: Update?
      do {
        existingUpdate = try self.database.update(withId: updateManifest.updateId, config: self.config)
      } catch {
        existingUpdateError = error
      }

      // if something has gone wrong on the server and we have two updates with the same id
      // but different scope keys, we should try to launch something rather than show a cryptic
      // error to the user.
      if let existingUpdate = existingUpdate,
        let existingUpdateScopeKey = existingUpdate.scopeKey,
        let updateManifestScopeKey = updateManifest.scopeKey,
        existingUpdateScopeKey != updateManifestScopeKey {
        do {
          try self.database.setScopeKey(updateManifestScopeKey, onUpdate: existingUpdate)
        } catch {
          self.finish(withError: UpdatesError.appLoaderUnknownError(cause: error))
          return
        }

        // swiftlint:disable:next line_length
        self.logger.warn(message: "AppLoader: Loaded an update with the same ID but a different scopeKey than one we already have on disk. This is a server error. Overwriting the scopeKey and loading the existing update.")
      }

      if let existingUpdate = existingUpdate,
        existingUpdate.status == .StatusReady {
        self.successBlock.let { it in
          self.completionQueue.async {
            it(updateResponse)
          }
        }
        return
      }

      if existingUpdate != nil {
        // we've already partially downloaded the update.
        // however, it's not ready, so we should try to download all the assets again.
        self.updateResponseContainingManifest = updateResponse
      } else {
        if let existingUpdateError = existingUpdateError {
          self.logger.warn(message: "Failed to select old update from DB: \(existingUpdateError.localizedDescription)")
        }

        // no update already exists with this ID, so we need to insert it and download everything.
        self.updateResponseContainingManifest = updateResponse
        do {
          try self.database.addUpdate(updateManifest, config: self.config)
        } catch {
          self.finish(withError: UpdatesError.appLoaderUnknownError(cause: error))
          return
        }
      }

      if let assets = updateManifest.assets(),
        !assets.isEmpty {
        self.assetsToLoad = assets
        let embeddedUpdate = self.embeddedUpdate
        let embeddedAssetsByKey = Dictionary(
          (embeddedUpdate?.assets() ?? []).compactMap { embeddedAsset in
            embeddedAsset.key.map { ($0, embeddedAsset) }
          },
          uniquingKeysWith: { first, _ in first }
        )
        let requestedUpdate: Update? = {
          if let launchedUpdate = self.launchedUpdate,
            launchedUpdate.updateId == updateManifest.updateId {
            return nil
          }
          return updateManifest
        }()
        self.requestedUpdate = requestedUpdate
        let extraHeaders = FileDownloader.extraHeadersForRemoteAssetRequest(
          launchedUpdate: self.launchedUpdate,
          embeddedUpdate: embeddedUpdate,
          requestedUpdate: requestedUpdate
        )

        for asset in assets {
          // before downloading, check to see if we already have this asset in the database
          let matchingDbEntry = try? self.database.asset(withKey: asset.key)

          if let matchingDbEntry = matchingDbEntry,
            !matchingDbEntry.filename.isEmpty {
            // merge fields from existing database entry into our current asset object
            // retaining the original object since it's used in self->_assetsToLoad
            // (this is different from on Android, where we keep the database-sourced object instead)
            do {
              try self.database.mergeAsset(asset, withExistingEntry: matchingDbEntry)
            } catch {
              self.logger.warn(message: "Failed to merge asset with existing database entry: \(error.localizedDescription)")
            }

            // make sure the file actually exists on disk
            FileDownloader.assetFilesQueue.async {
              let urlOnDisk = self.directory.appendingPathComponent(asset.filename)
              if FileManager.default.fileExists(atPath: urlOnDisk.path) {
                // file already exists, we don't need to download it again
                DispatchQueue.global().async {
                  self.handleAssetDownloadAlreadyExists(asset)
                }
              } else {
                self.downloadAsset(asset, extraHeaders: extraHeaders)
              }
            }
          } else {
            FileDownloader.assetFilesQueue.async {
              if self.copyAssetFromEmbeddedBundleIfPresent(asset, embeddedAssetsByKey: embeddedAssetsByKey) {
                return
              }
              self.downloadAsset(asset, extraHeaders: extraHeaders)
            }
          }
        }
      } else {
        self.finish()
      }
    }
  }

  /**
   * Satisfies an asset from the embedded update in the app binary rather than downloading it.
   * Embedded assets have no database row when copying is off, so the lookup above misses them and
   * a remote update would otherwise re-download bytes that already ship in the app.
   *
   * Returns true when it handled the asset. Every failure returns false so the caller downloads it.
   *
   * Must be called on `FileDownloader.assetFilesQueue`.
   */
  internal func copyAssetFromEmbeddedBundleIfPresent(
    _ asset: UpdateAsset,
    embeddedAssetsByKey: [String: UpdateAsset]
  ) -> Bool {
    guard reusesEmbeddedAssets else {
      return false
    }

    guard let key = asset.key,
      UpdatesUtils.isSafeFilename(asset.filename),
      let embeddedAsset = embeddedAssetsByKey[key],
      embeddedAsset.mainBundleFilename != nil,
      let bundlePath = UpdatesUtils.path(forBundledAsset: embeddedAsset, in: embeddedAssetsBundle) else {
      return false
    }

    guard let data = try? Data(contentsOf: URL(fileURLWithPath: bundlePath), options: .mappedIfSafe) else {
      logger.warn(message: "AppLoader: could not read embedded asset \(key), downloading it instead")
      return false
    }

    // Keys are content-addressed, so a mismatch means the manifest is wrong about what we shipped.
    if let expectedHash = asset.expectedHash {
      let actualHash = UpdatesUtils.base64UrlEncodedSHA256WithData(data)
      if expectedHash != actualHash {
        logger.warn(
          message: "AppLoader: embedded asset \(key) hashed to \(actualHash) but the update expects \(expectedHash), downloading it instead"
        )
        return false
      }
    }

    do {
      try data.write(to: directory.appendingPathComponent(asset.filename), options: .atomic)
    } catch {
      logger.warn(message: "AppLoader: could not copy embedded asset \(key) into the updates directory, downloading it instead")
      return false
    }

    DispatchQueue.global().async {
      self.handleAssetDownload(withData: data, response: nil, asset: asset)
    }
    return true
  }

  public func handleAssetDownloadAlreadyExists(_ asset: UpdateAsset) {
    arrayLock.lock()
    assetsToLoad.remove(asset)
    existingAssets.append(asset)
    notifyProgress(withAsset: asset)
    notifyAssetLoadProgress(asset: asset, progress: 1)
    if assetsToLoad.isEmpty {
      finish()
    }
    arrayLock.unlock()
  }

  public func handleAssetDownload(withError error: UpdatesError, asset: UpdateAsset) {
    // TODO: retry. for now log an error
    logger.error(cause: error, code: UpdatesErrorCode.assetsFailedToLoad)
    arrayLock.lock()
    assetsToLoad.remove(asset)
    erroredAssets.append(asset)
    notifyProgress(withAsset: asset)
    if assetsToLoad.isEmpty {
      finish()
    }
    arrayLock.unlock()
  }

  public func assetLoadProgressListener(asset: UpdateAsset, progress: Double) {
    arrayLock.lock()
    notifyAssetLoadProgress(asset: asset, progress: progress)
    arrayLock.unlock()
  }

  /**
   * This should only be called on threads that have acquired self->_arrayLock
   */
  public func notifyAssetLoadProgress(asset: UpdateAsset, progress: Double) {
    assetDownloadProgress[asset] = progress
    let totalAssetsCount = finishedAssets.count + existingAssets.count + erroredAssets.count + assetsToLoad.count
    if totalAssetsCount > 0 {
      let progress = assetDownloadProgress.values.reduce(0, +) / Double(totalAssetsCount)
      if let assetLoadProgressBlock = assetLoadProgressBlock {
        assetLoadProgressBlock(progress)
      }
    }
  }

  public func handleAssetDownload(withData data: Data, response: URLResponse?, asset: UpdateAsset) {
    arrayLock.lock()
    assetsToLoad.remove(asset)

    if let response = response as? HTTPURLResponse,
      let allHeaderFields = response.allHeaderFields as? [String: Any] {
      asset.headers = allHeaderFields
    }
    asset.contentHash = UpdatesUtils.hexEncodedSHA256WithData(data)
    asset.downloadTime = Date()

    finishedAssets.append(asset)
    notifyProgress(withAsset: asset)
    notifyAssetLoadProgress(asset: asset, progress: 1)
    if assetsToLoad.isEmpty {
      finish()
    }
    arrayLock.unlock()
  }

  // MARK: - internal

  private func shouldStartLoadingUpdate(_ updateResponse: UpdateResponse) -> Bool {
    return updateResponseBlock!(updateResponse)
  }

  /**
   * This should only be called on threads that have acquired self->_arrayLock
   */
  private func notifyProgress(withAsset asset: UpdateAsset) {
    assetBlock.let { it in
      it(
        asset,
        finishedAssets.count + existingAssets.count,
        erroredAssets.count,
        finishedAssets.count + existingAssets.count + erroredAssets.count + assetsToLoad.count
      )
    }
  }

  private func finish(withError error: UpdatesError) {
    completionQueue.async {
      self.errorBlock.let { it in
        it(error)
      }
      self.reset()
    }
  }

  private func finish() {
    database.databaseQueue.async {
      self.arrayLock.lock()

      guard let updateResponse = self.updateResponseContainingManifest,
        let updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest else {
        self.arrayLock.unlock()
        self.finish(withError: UpdatesError.appLoaderFinishedWithoutManifest)
        return
      }

      var assetsToLink: [UpdateAsset] = []
      for existingAsset in self.existingAssets {
        let existingAssetFound: Bool
        do {
          existingAssetFound = try self.database.asset(withKey: existingAsset.key) != nil
        } catch {
          // treating a failed check as "not found" would re-insert an existing asset, and the
          // key-conflicting replace cascade-deletes every update that uses the old row
          self.arrayLock.unlock()
          self.finish(withError: UpdatesError.appLoaderUnknownError(cause: error))
          return
        }

        if existingAssetFound {
          assetsToLink.append(existingAsset)
        } else {
          // the database and filesystem have gotten out of sync
          // do our best to create a new entry for this file even though it already existed on disk
          // TODO: we should probably get rid of this assumption that if an asset exists on disk with the same filename, it's the same asset
          var contents = try? Data(contentsOf: self.directory.appendingPathComponent(existingAsset.filename))
          if contents == nil {
            if let embeddedUrl = UpdatesUtils.url(forBundledAsset: existingAsset) {
              contents = try? Data(contentsOf: embeddedUrl)
            }
          }
          // This replaces the old force try
          if !UpdatesUtils.isNativeDebuggingEnabled() {
            assert(contents != nil)
          }
          if let contents = contents {
            existingAsset.contentHash = UpdatesUtils.hexEncodedSHA256WithData(contents)
            existingAsset.downloadTime = Date()
            self.finishedAssets.append(existingAsset)
          }
        }
      }

      do {
        try self.database.finishUpdateRegistration(
          updateManifest,
          newAssets: self.finishedAssets,
          existingAssets: assetsToLink,
          markFinished: self.erroredAssets.isEmpty
        )
      } catch {
        self.arrayLock.unlock()
        self.finish(withError: UpdatesError.appLoaderUnknownError(cause: error))
        return
      }

      var successBlock: AppLoaderSuccessBlock?
      var errorBlock: AppLoaderErrorBlock?

      if !self.erroredAssets.isEmpty {
        if let selfErrorBlock = self.errorBlock {
          errorBlock = selfErrorBlock
        }
      } else {
        if let selfSuccessBlock = self.successBlock {
          successBlock = selfSuccessBlock
        }
      }

      self.arrayLock.unlock()

      self.completionQueue.async {
        if let errorBlock = errorBlock {
          errorBlock(UpdatesError.appLoaderFailedToLoadAllAssets)
        } else if let successBlock = successBlock {
          successBlock(updateResponse)
        }
      }
    }
  }
}

// swiftlint:enable unavailable_function
// swiftlint:enable closure_body_length
// swiftlint:enable force_unwrapping
