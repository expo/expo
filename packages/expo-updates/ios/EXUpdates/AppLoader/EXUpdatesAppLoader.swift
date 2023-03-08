//  Copyright © 2019 650 Industries. All rights reserved.

// this uses abstract class patterns
// swiftlint:disable unavailable_function

// swiftlint:disable closure_body_length
// swiftlint:disable function_body_length
// swiftlint:disable type_body_length

// this class uses a lot of implicit non-null stuff across function calls. not worth refactoring to just satisfy lint
// swiftlint:disable force_unwrapping

import Foundation

public typealias EXUpdatesAppLoaderManifestBlock = (_ update: EXUpdatesUpdate) -> Bool
public typealias EXUpdatesAppLoaderAssetBlock = (_ asset: EXUpdatesAsset, _ successfulAssetCount: Int, _ failedAssetCount: Int, _ totalAssetCount: Int) -> Void
public typealias EXUpdatesAppLoaderSuccessBlock = (_ update: EXUpdatesUpdate?) -> Void
public typealias EXUpdatesAppLoaderErrorBlock = (_ error: Error) -> Void

/**
 * Responsible for loading an update's manifest, enumerating the assets required for it to launch,
 * and loading them all onto disk and into SQLite.
 *
 * There are two sources from which an update can be loaded - a remote server given a URL, and the
 * application package. These correspond to the two loader subclasses.
 */
@objcMembers
public class EXUpdatesAppLoader: NSObject {
  private static let EXUpdatesAppLoaderErrorDomain = "EXUpdatesAppLoader"

  internal let config: EXUpdatesConfig
  internal let database: EXUpdatesDatabase
  internal let directory: URL
  internal let launchedUpdate: EXUpdatesUpdate?

  private var updateManifest: EXUpdatesUpdate?

  internal var manifestBlock: EXUpdatesAppLoaderManifestBlock?
  internal var assetBlock: EXUpdatesAppLoaderAssetBlock?
  internal var successBlock: EXUpdatesAppLoaderSuccessBlock?
  internal var errorBlock: EXUpdatesAppLoaderErrorBlock?

  private var assetsToLoad: [EXUpdatesAsset] = []
  private var erroredAssets: [EXUpdatesAsset] = []
  private var finishedAssets: [EXUpdatesAsset] = []
  private var existingAssets: [EXUpdatesAsset] = []

  private let arrayLock: NSLock = NSLock()
  private let completionQueue: DispatchQueue

  public required init(config: EXUpdatesConfig, database: EXUpdatesDatabase, directory: URL, launchedUpdate: EXUpdatesUpdate?, completionQueue: DispatchQueue) {
    self.config = config
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
    updateManifest = nil
    manifestBlock = nil
    assetBlock = nil
    successBlock = nil
    errorBlock = nil
  }

  // MARK: - abstract methods

  public func loadUpdate(
    fromURL url: URL,
    onManifest manifestBlock: @escaping EXUpdatesAppLoaderManifestBlock,
    asset assetBlock: @escaping EXUpdatesAppLoaderAssetBlock,
    success successBlock: @escaping EXUpdatesAppLoaderSuccessBlock,
    error errorBlock: @escaping EXUpdatesAppLoaderErrorBlock
  ) {
    preconditionFailure("Must override in concrete class")
  }

  public func downloadAsset(_ asset: EXUpdatesAsset) {
    preconditionFailure("Must override in concrete class")
  }

  // MARK: - loading and database logic

  internal func startLoading(fromManifest updateManifest: EXUpdatesUpdate) {
    guard shouldStartLoadingUpdate(updateManifest) else {
      successBlock.let { it in
        completionQueue.async {
          it(nil)
        }
      }
      return
    }

    if updateManifest.isDevelopmentMode {
      database.databaseQueue.async {
        do {
          try self.database.addUpdate(updateManifest)
          try self.database.markUpdateFinished(updateManifest)
        } catch {
          self.finish(withError: error)
          return
        }

        let successBlock = self.successBlock
        self.completionQueue.async {
          successBlock.let { it in
            it(updateManifest)
          }
          self.reset()
        }
      }
      return
    }

    database.databaseQueue.async {
      var existingUpdateError: Error?
      var existingUpdate: EXUpdatesUpdate?
      do {
        existingUpdate = try self.database.update(withId: updateManifest.updateId, config: self.config)
      } catch {
        existingUpdateError = error
      }

      // if something has gone wrong on the server and we have two updates with the same id
      // but different scope keys, we should try to launch something rather than show a cryptic
      // error to the user.
      if let existingUpdate = existingUpdate,
        existingUpdate.scopeKey != updateManifest.scopeKey {
        do {
          try self.database.setScopeKey(updateManifest.scopeKey, onUpdate: existingUpdate)
        } catch {
          self.finish(withError: error)
          return
        }

        // swiftlint:disable:next line_length
        NSLog("EXUpdatesAppLoader: Loaded an update with the same ID but a different scopeKey than one we already have on disk. This is a server error. Overwriting the scopeKey and loading the existing update.")
      }

      if let existingUpdate = existingUpdate,
        existingUpdate.status == .StatusReady {
        self.successBlock.let { it in
          self.completionQueue.async {
            it(updateManifest)
          }
        }
        return
      }

      if existingUpdate != nil {
        // we've already partially downloaded the update.
        // however, it's not ready, so we should try to download all the assets again.
        self.updateManifest = updateManifest
      } else {
        if let existingUpdateError = existingUpdateError {
          NSLog("Failed to select old update from DB: %@", existingUpdateError.localizedDescription)
        }

        // no update already exists with this ID, so we need to insert it and download everything.
        self.updateManifest = updateManifest
        do {
          try self.database.addUpdate(updateManifest)
        } catch {
          self.finish(withError: error)
          return
        }
      }

      if let assets = updateManifest.assets(),
        !assets.isEmpty {
        self.assetsToLoad = assets
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
              NSLog("Failed to merge asset with existing database entry: %@", error.localizedDescription)
            }

            // make sure the file actually exists on disk
            EXUpdatesFileDownloader.assetFilesQueue.async {
              let urlOnDisk = self.directory.appendingPathComponent(asset.filename)
              if FileManager.default.fileExists(atPath: urlOnDisk.path) {
                // file already exists, we don't need to download it again
                DispatchQueue.global().async {
                  self.handleAssetDownloadAlreadyExists(asset)
                }
              } else {
                self.downloadAsset(asset)
              }
            }
          } else {
            self.downloadAsset(asset)
          }
        }
      } else {
        self.finish()
      }
    }
  }

  internal func handleAssetDownloadAlreadyExists(_ asset: EXUpdatesAsset) {
    arrayLock.lock()
    assetsToLoad.remove(asset)
    existingAssets.append(asset)
    notifyProgress(withAsset: asset)
    if assetsToLoad.isEmpty {
      finish()
    }
    arrayLock.unlock()
  }

  internal func handleAssetDownload(withError error: Error, asset: EXUpdatesAsset) {
    // TODO: retry. for now log an error
    NSLog("error loading asset \(asset.key ?? "nil key"): \(error.localizedDescription)")
    arrayLock.lock()
    assetsToLoad.remove(asset)
    erroredAssets.append(asset)
    notifyProgress(withAsset: asset)
    if assetsToLoad.isEmpty {
      finish()
    }
    arrayLock.unlock()
  }

  internal func handleAssetDownload(withData data: Data, response: URLResponse?, asset: EXUpdatesAsset) {
    arrayLock.lock()
    assetsToLoad.remove(asset)

    if let response = response as? HTTPURLResponse,
      let allHeaderFields = response.allHeaderFields as? [String: Any] {
      asset.headers = allHeaderFields
    }
    asset.contentHash = EXUpdatesUtils.hexEncodedSHA256WithData(data)
    asset.downloadTime = Date()

    finishedAssets.append(asset)
    notifyProgress(withAsset: asset)
    if assetsToLoad.isEmpty {
      finish()
    }
    arrayLock.unlock()
  }

  // MARK: - internal

  private func shouldStartLoadingUpdate(_ updateManifest: EXUpdatesUpdate) -> Bool {
    return manifestBlock!(updateManifest)
  }

  /**
   * This should only be called on threads that have acquired self->_arrayLock
   */
  private func notifyProgress(withAsset asset: EXUpdatesAsset) {
    assetBlock.let { it in
      it(
        asset,
        finishedAssets.count + existingAssets.count,
        erroredAssets.count,
        finishedAssets.count + existingAssets.count + erroredAssets.count + assetsToLoad.count
      )
    }
  }

  private func finish(withError error: Error) {
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

      for existingAsset in self.existingAssets {
        var existingAssetFound: Bool = false
        do {
          existingAssetFound = try self.database.addExistingAsset(existingAsset, toUpdateWithId: self.updateManifest!.updateId)
        } catch {
          NSLog("Error searching for existing asset in DB: %@", error.localizedDescription)
        }

        if !existingAssetFound {
          // the database and filesystem have gotten out of sync
          // do our best to create a new entry for this file even though it already existed on disk
          // TODO: we should probably get rid of this assumption that if an asset exists on disk with the same filename, it's the same asset

          // this has always force-tried implicitly, could probably do some better error handling
          // swiftlint:disable:next force_try
          let contents = try! Data(contentsOf: self.directory.appendingPathComponent(existingAsset.filename))
          existingAsset.contentHash = EXUpdatesUtils.hexEncodedSHA256WithData(contents)
          existingAsset.downloadTime = Date()
          self.finishedAssets.append(existingAsset)
        }
      }

      do {
        try self.database.addNewAssets(self.finishedAssets, toUpdateWithId: self.updateManifest!.updateId)
      } catch {
        self.arrayLock.unlock()
        self.finish(withError: error)
        return
      }

      if self.erroredAssets.isEmpty {
        do {
          try self.database.markUpdateFinished(self.updateManifest!)
        } catch {
          self.arrayLock.unlock()
          self.finish(withError: error)
          return
        }
      }

      var successBlock: EXUpdatesAppLoaderSuccessBlock?
      var errorBlock: EXUpdatesAppLoaderErrorBlock?

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
          errorBlock(NSError(
            domain: EXUpdatesAppLoader.EXUpdatesAppLoaderErrorDomain,
            code: 1012,
            userInfo: [
              NSLocalizedDescriptionKey: "Failed to load all assets"
            ]
          ))
        } else if let successBlock = successBlock {
          successBlock(self.updateManifest!)
        }
      }
    }
  }
}
