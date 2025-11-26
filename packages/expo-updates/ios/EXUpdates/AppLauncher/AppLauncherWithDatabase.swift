//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length
// swiftlint:disable force_unwrapping

import Foundation

public typealias AppLauncherUpdateCompletionBlock = (_ error: UpdatesError?, _ update: Update?) -> Void

/**
 * Implementation of AppLauncher that uses the SQLite database and expo-updates file store
 * as the source of updates.
 *
 * Uses the SelectionPolicy to choose an update from SQLite to launch, then ensures that
 * the update is safe and ready to launch (i.e. all the assets that SQLite expects to be stored on
 * disk are actually there).
 *
 * This class also includes failsafe code to attempt to re-download any assets unexpectedly missing
 * from disk (since it isn't necessarily safe to just revert to an older update in this case).
 * Distinct from the AppLoader classes, though, this class does *not* make any major
 * modifications to the database; its role is mostly to read the database and ensure integrity with
 * the file system.
 *
 * It's important that the update to launch is selected *before* any other checks, e.g. the above
 * check for assets on disk. This is to preserve the invariant that no older update should ever be
 * launched after a newer one has been launched.
 */
@objc(EXUpdatesAppLauncherWithDatabase)
@objcMembers
public class AppLauncherWithDatabase: NSObject, AppLauncher {
  public var launchedUpdate: Update?
  public var launchAssetUrl: URL?
  public var assetFilesMap: [String: String]?

  private let launcherQueue: DispatchQueue
  private var completedAssets: Int
  private let config: UpdatesConfig
  private let database: UpdatesDatabase
  private let directory: URL
  private let logger: UpdatesLogger
  public private(set) var completionQueue: DispatchQueue
  public private(set) var completion: AppLauncherCompletionBlock?

  private var launchAssetError: UpdatesError?

  public required init(config: UpdatesConfig, database: UpdatesDatabase, directory: URL, completionQueue: DispatchQueue, logger: UpdatesLogger) {
    self.launcherQueue = DispatchQueue(label: "expo.launcher.LauncherQueue")
    self.completedAssets = 0
    self.config = config
    self.database = database
    self.directory = directory
    self.completionQueue = completionQueue
    self.logger = logger
  }

  public func isUsingEmbeddedAssets() -> Bool {
    return assetFilesMap == nil
  }

  public static func launchableUpdate(
    withConfig config: UpdatesConfig,
    database: UpdatesDatabase,
    selectionPolicy: SelectionPolicy,
    completionQueue: DispatchQueue,
    completion: @escaping AppLauncherUpdateCompletionBlock
  ) {
    database.databaseQueue.async {
      var launchableUpdates: [Update]?
      var launchableUpdatesError: UpdatesError?
      do {
        launchableUpdates = try database.launchableUpdates(withConfig: config)
      } catch {
        launchableUpdatesError = UpdatesError.appLauncherWithDatabaseUnknownError(cause: error)
      }

      var manifestFilters: [String: Any]?
      var manifestFiltersError: UpdatesError?
      do {
        manifestFilters = try database.manifestFilters(withScopeKey: config.scopeKey)
      } catch {
        manifestFiltersError = UpdatesError.appLauncherWithDatabaseUnknownError(cause: error)
      }

      completionQueue.async {
        guard let launchableUpdates = launchableUpdates else {
          completion(launchableUpdatesError!, nil)
          return
        }

        if let manifestFiltersError = manifestFiltersError {
          completion(manifestFiltersError, nil)
          return
        }

        let embeddedManifest = EmbeddedAppLoader.originalEmbeddedManifest(withConfig: config, database: database)
        var filteredLaunchableUpdates: [Update] = []
        for update in launchableUpdates {
          // We can only run an update marked as embedded if it's actually the update embedded in the
          // current binary. We might have an older update from a previous binary still listed in the
          // database with Embedded status so we need to filter that out here.
          if update.status == UpdateStatus.StatusEmbedded && update.updateId != embeddedManifest?.updateId {
            continue
          }

          // If embedded update is disabled, we should exclude embedded update from launchable updates
          if !config.hasEmbeddedUpdate && embeddedManifest?.updateId == update.updateId {
            continue
          }

          filteredLaunchableUpdates.append(update)
        }

        completion(nil, selectionPolicy.launchableUpdate(fromUpdates: filteredLaunchableUpdates, filters: manifestFilters))
      }
    }
  }

  public func launchableUpdate(
    selectionPolicy: SelectionPolicy,
    completion: @escaping AppLauncherUpdateCompletionBlock
  ) {
    AppLauncherWithDatabase.launchableUpdate(
      withConfig: config,
      database: database,
      selectionPolicy: selectionPolicy,
      completionQueue: completionQueue,
      completion: completion
    )
  }

  public func launchUpdate(
    withSelectionPolicy selectionPolicy: SelectionPolicy,
    completion: @escaping AppLauncherCompletionBlock
  ) {
    precondition(self.completion == nil, "AppLauncher:launchUpdateWithSelectionPolicy:completion should not be called twice on the same instance")
    self.completion = completion

    if launchedUpdate == nil {
      launchableUpdate(selectionPolicy: selectionPolicy) { error, launchableUpdate in
        if error != nil || launchableUpdate == nil {
          if let completionInner = self.completion {
            self.completionQueue.async {
              let cause = UpdatesError.appLauncherNoLaunchableUpdates(cause: error)
              completionInner(cause, false)
            }
          }
        } else {
          self.launchedUpdate = launchableUpdate
          self.finishLaunch()
        }
      }
    } else {
      finishLaunch()
    }
  }

  private func finishLaunch() {
    markUpdateAccessed()
    ensureAllAssetsExist()
  }

  private func markUpdateAccessed() {
    guard launchedUpdate != nil else {
      preconditionFailure("launchedUpdate should be nonnull before calling markUpdateAccessed")
    }
    database.databaseQueue.async {
      do {
        try self.database.markUpdateAccessed(self.launchedUpdate!)
      } catch {
        self.logger.warn(message: "Failed to mark update as recently accessed: \(error.localizedDescription)")
      }
    }
  }

  public func ensureAllAssetsExist() {
    guard let launchedUpdate = launchedUpdate else {
      preconditionFailure("launchedUpdate should be nonnull before calling markUpdateAccessed")
    }

    if launchedUpdate.status == UpdateStatus.StatusEmbedded {
      precondition(assetFilesMap == nil, "assetFilesMap should be null for embedded updates")
      launchAssetUrl = Bundle.main.url(
        forResource: EmbeddedAppLoader.EXUpdatesBareEmbeddedBundleFilename,
        withExtension: EmbeddedAppLoader.EXUpdatesBareEmbeddedBundleFileType
      )

      completionQueue.async {
        self.completion!(self.launchAssetError, self.launchAssetUrl != nil)
        self.completion = nil
      }
      return
    }

    if launchedUpdate.status == UpdateStatus.StatusDevelopment {
      completionQueue.async {
        self.completion!(nil, true)
        self.completion = nil
      }
      return
    }

    // Initialize asset map with the embedded assets that may not be part of this update
    self.assetFilesMap = UpdatesUtils.embeddedAssetsMap(withConfig: config, database: database, logger: logger)

    let assets = launchedUpdate.assets()!
    let totalAssetCount = assets.count
    for asset in assets {
      let assetLocalUrl = directory.appendingPathComponent(asset.filename)
      ensureAssetExists(asset: asset, withLocalUrl: assetLocalUrl) { exists in
        dispatchPrecondition(condition: .onQueue(self.launcherQueue))
        self.completedAssets += 1

        if exists {
          if asset.isLaunchAsset {
            self.launchAssetUrl = assetLocalUrl
          } else {
            if let assetKey = asset.key {
              self.assetFilesMap![assetKey] = assetLocalUrl.absoluteString
            }
          }
        }

        if self.completedAssets == totalAssetCount {
          self.completionQueue.async {
            self.completion!(self.launchAssetError, self.launchAssetUrl != nil)
            self.completion = nil
          }
        }
      }
    }
  }

  private func ensureAssetExists(asset: UpdateAsset, withLocalUrl assetLocalUrl: URL, completion: @escaping (Bool) -> Void) {
    checkExistence(ofAsset: asset, withLocalUrl: assetLocalUrl) { exists in
      if exists {
        completion(true)
        return
      }

      FileDownloader.assetFilesQueue.async {
        if FileManager.default.fileExists(atPath: assetLocalUrl.path) {
          self.logger.warn(
            message: "Asset \(asset.key ?? asset.filename) exists but is invalid, will re-download/copy",
            code: UpdatesErrorCode.assetsFailedToLoad
          )
          do {
            try FileManager.default.removeItem(atPath: assetLocalUrl.path)
          } catch {
            self.logger.warn(
              message: "Failed to delete corrupted asset \(asset.key ?? asset.filename): \(error.localizedDescription)",
              code: UpdatesErrorCode.assetsFailedToLoad
            )
          }
        }

        self.launcherQueue.async {
          self.maybeCopyAssetFromMainBundle(asset, withLocalUrl: assetLocalUrl) { success, error in
            if success {
              completion(true)
              return
            }

            if let error {
              self.logger.warn(message: "AppLauncherWithDatabase: Error copying embedded asset \(asset.key ?? ""): \(error.localizedDescription)")
            }

            self.downloadAsset(asset, withLocalUrl: assetLocalUrl) { downloadAssetError, downloadAssetAsset, _ in
              if let downloadAssetError = downloadAssetError {
                if downloadAssetAsset.isLaunchAsset {
                  // save the error -- since this is the launch asset, the launcher will fail
                  // so we want to propagate this error
                  self.launchAssetError = downloadAssetError
                }
                self.logger.warn(message: "AppLauncherWithDatabase: Failed to load missing asset \(downloadAssetAsset.key ?? ""): \(downloadAssetError.localizedDescription)")
                completion(false)
              } else {
                // attempt to update the database record to match the newly downloaded asset
                // but don't block launching on this
                self.database.databaseQueue.async {
                  do {
                    try self.database.updateAsset(downloadAssetAsset)
                  } catch {
                    self.logger.warn(message: "AppLauncherWithDatabase: Could not write data for downloaded asset to database: \(error.localizedDescription)")
                  }
                }
                completion(true)
              }
            }
          }
        }
      }
    }
  }

  private func checkExistence(ofAsset asset: UpdateAsset, withLocalUrl assetLocalUrl: URL, completion: @escaping (Bool) -> Void) {
    FileDownloader.assetFilesQueue.async {
      let isValid = self.isAssetValid(asset: asset, atPath: assetLocalUrl.path)
      self.launcherQueue.async {
        completion(isValid)
      }
    }
  }

  private func isAssetValid(asset: UpdateAsset, atPath path: String) -> Bool {
    guard FileManager.default.fileExists(atPath: path) else {
      return false
    }

    if asset.isLaunchAsset {
      if let expectedSize = asset.expectedSize {
        do {
          let attributes = try FileManager.default.attributesOfItem(atPath: path)
          if let actualSize = attributes[.size] as? NSNumber {
            if actualSize.int64Value != expectedSize.int64Value {
              logger.warn(
                message: "Launch asset \(asset.key ?? asset.filename) size mismatch: expected=\(expectedSize.int64Value) actual=\(actualSize.int64Value). File is corrupted.",
                code: UpdatesErrorCode.assetsFailedToLoad
              )
              return false
            }
          }
        } catch {
          logger.warn(
            message: "Failed to get file size for launch asset \(asset.key ?? asset.filename): \(error.localizedDescription)",
            code: UpdatesErrorCode.assetsFailedToLoad
          )
          return false
        }
      } else {
        do {
          let data = try Data(contentsOf: URL(fileURLWithPath: path))
          let actualHash = UpdatesUtils.hexEncodedSHA256WithData(data)
          if let contentHash = asset.contentHash, actualHash != contentHash {
            logger.warn(
              message: "Launch asset \(asset.key ?? asset.filename) hash mismatch. File is corrupted.",
              code: UpdatesErrorCode.assetsFailedToLoad
            )
            return false
          }
        } catch {
          logger.warn(
            message: "Failed to validate launch asset \(asset.key ?? asset.filename): \(error.localizedDescription)",
            code: UpdatesErrorCode.assetsFailedToLoad
          )
          return false
        }
      }
    }

    return true
  }

  private func maybeCopyAssetFromMainBundle(
    _ asset: UpdateAsset,
    withLocalUrl assetLocalUrl: URL,
    completion: @escaping (Bool, UpdatesError?) -> Void
  ) {
    guard let embeddedManifest = EmbeddedAppLoader.embeddedManifest(withConfig: config, database: database) else {
      completion(false, nil)
      return
    }

    let matchingAsset = embeddedManifest.assets()!.first { embeddedAsset in
      return embeddedAsset.key != nil && embeddedAsset.key == asset.key
    }

    if let matchingAsset = matchingAsset, matchingAsset.mainBundleFilename != nil {
      FileDownloader.assetFilesQueue.async {
        guard let bundlePath = UpdatesUtils.path(forBundledAsset: matchingAsset) else {
          self.launcherQueue.async {
            completion(
              false,
              UpdatesError.appLauncherWithDatabaseAssetBundlePathNil
            )
          }
          return
        }

        do {
          try FileManager.default.copyItem(atPath: bundlePath, toPath: assetLocalUrl.path)

          if asset.isLaunchAsset {
            let attributes = try FileManager.default.attributesOfItem(atPath: assetLocalUrl.path)
            if let fileSize = attributes[.size] as? NSNumber {
              asset.expectedSize = fileSize
            }
          }

          self.launcherQueue.async {
            completion(true, nil)
          }
        } catch {
          self.launcherQueue.async {
            completion(
              false,
              UpdatesError.appLauncherWithDatabaseAssetCopyFailed
            )
          }
        }
      }
      return
    }
    self.launcherQueue.async {
      completion(false, nil)
    }
  }

  private func downloadAsset(_ asset: UpdateAsset, withLocalUrl assetLocalUrl: URL, completion: @escaping (UpdatesError?, UpdateAsset, URL) -> Void) {
    guard let assetUrl = asset.url else {
      completion(
        UpdatesError.appLauncherWithDatabaseAssetMissingUrl,
        asset,
        assetLocalUrl
      )
      return
    }

    FileDownloader.assetFilesQueue.async {
      self.downloader.downloadAsset(
        asset: asset,
        fromURL: assetUrl,
        verifyingHash: asset.expectedHash,
        toPath: assetLocalUrl.path,
        extraHeaders: asset.extraRequestHeaders ?? [:],
        allowPatch: false,
        launchedUpdate: self.launchedUpdate
      ) { data, response, base64URLEncodedSHA256Hash in
        self.launcherQueue.async {
          if let response = response as? HTTPURLResponse {
            asset.headers = response.allHeaderFields as? [String: Any]
          }
          asset.contentHash = base64URLEncodedSHA256Hash
          asset.downloadTime = Date()
          if asset.isLaunchAsset {
            asset.expectedSize = NSNumber(value: data.count)
          }
          completion(nil, asset, assetLocalUrl)
        }
      } errorBlock: { error in
        self.launcherQueue.async {
          completion(error, asset, assetLocalUrl)
        }
      }
    }
  }

  private lazy var downloader: FileDownloader = {
    FileDownloader(
      config: config,
      logger: self.logger,
      updatesDirectory: self.directory,
      database: self.database
    )
  }()
}
// swiftlint:enable closure_body_length
// swiftlint:enable force_unwrapping
