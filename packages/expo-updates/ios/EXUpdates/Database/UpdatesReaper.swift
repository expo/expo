// Copyright 2015-present 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length
// swiftlint:disable function_parameter_count

import Foundation

@objc(EXUpdatesReaper)
@objcMembers
public final class UpdatesReaper: NSObject {
  /**
   * Safely clears old, unused assets and updates from the filesystem and database.
   *
   * Should be run when no other updates-related events are occurring (e.g. update download).
   */
  public static func reapUnusedUpdates(
    withConfig config: UpdatesConfig,
    database: UpdatesDatabase,
    directory: URL,
    selectionPolicy: SelectionPolicy,
    launchedUpdate: Update,
    logger: UpdatesLogger
  ) {
    database.databaseQueue.async {
      let beginDeleteFromDatabase = Date()

      do {
        try database.markUpdateFinished(launchedUpdate)
      } catch {
        logger.warn(.reaperFailed, cause: error)
        return
      }

      var allUpdates: [Update]
      do {
        allUpdates = try database.allUpdates(withConfig: config)
      } catch {
        logger.warn(.reaperFailed, cause: error)
        return
      }

      var manifestFilters: [String: Any]?
      do {
        manifestFilters = try database.manifestFilters(withScopeKey: config.scopeKey)
      } catch {
        logger.warn(.localMetadataReadFailed, cause: error, values: ["field": "manifestFilters"])
        return
      }

      let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: launchedUpdate, updates: allUpdates, filters: manifestFilters)
      do {
        try database.deleteUpdates(updatesToDelete)
      } catch {
        logger.warn(.reaperFailed, cause: error)
        return
      }

      let assetsForDeletion: [UpdateAsset]
      do {
        assetsForDeletion = try database.deleteUnusedAssets()
      } catch {
        logger.warn(.reaperFailed, cause: error)
        return
      }

      logger.info(message: "Deleted assets and updates from SQLite in \(beginDeleteFromDatabase.timeIntervalSinceNow * -1000) ms")

      FileDownloader.assetFilesQueue.async {
        var deletedAssets = 0
        var erroredAssets: [UpdateAsset] = []

        let beginDeleteAssets = Date()
        for asset in assetsForDeletion {
          guard UpdatesUtils.isSafeFilename(asset.filename) else {
            logger.warn(.reaperUnsafePath, values: ["filename": asset.filename])
            continue
          }
          let localUrl = directory.appendingPathComponent(asset.filename)
          if FileManager.default.fileExists(atPath: localUrl.path) {
            do {
              try FileManager.default.removeItem(at: localUrl)
              deletedAssets += 1
            } catch {
              logger.warn(.reaperAssetDeleteFailed, cause: error, values: ["path": localUrl.path, "retry": "false"])
              erroredAssets.append(asset)
            }
          } else {
            deletedAssets += 1
          }
        }
        logger.info(message: "Deleted \(deletedAssets) assets from disk in \(beginDeleteAssets.timeIntervalSinceNow * -1000) ms")

        // retry errored deletions
        let beginRetryDeletes = Date()
        for asset in erroredAssets {
          let localUrl = directory.appendingPathComponent(asset.filename)
          if FileManager.default.fileExists(atPath: localUrl.path) {
            do {
              try FileManager.default.removeItem(at: localUrl)
            } catch {
              logger.warn(.reaperAssetDeleteFailed, cause: error, values: ["path": localUrl.path, "retry": "true"])
            }
          }
        }

        logger.info(message: "Retried deleting assets from disk in \(beginRetryDeletes.timeIntervalSinceNow * -1000) ms")
      }
    }
  }
}

// swiftlint:enable function_parameter_count
// swiftlint:enable closure_body_length
