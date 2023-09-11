// Copyright 2015-present 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length

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
    launchedUpdate: Update
  ) {
    database.databaseQueue.async {
      let beginDeleteFromDatabase = Date()

      do {
        try database.markUpdateFinished(launchedUpdate)
      } catch {
        NSLog("Error reaping updates: %@", [error.localizedDescription])
        return
      }

      var allUpdates: [Update]
      do {
        allUpdates = try database.allUpdates(withConfig: config)
      } catch {
        NSLog("Error reaping updates: %@", [error.localizedDescription])
        return
      }

      var manifestFilters: [String: Any]?
      do {
        manifestFilters = try database.manifestFilters(withScopeKey: config.scopeKey.require("Must have scopeKey in config"))
      } catch {
        NSLog("Error selecting manifest filters while reaping updates: %@", [error.localizedDescription])
        return
      }

      var updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: launchedUpdate, updates: allUpdates, filters: manifestFilters)
      do {
        try database.deleteUpdates(updatesToDelete)
      } catch {
        NSLog("Error reaping updates: %@", [error.localizedDescription])
        return
      }

      let assetsForDeletion: [UpdateAsset]
      do {
        assetsForDeletion = try database.deleteUnusedAssets()
      } catch {
        NSLog("Error reaping updates: %@", [error.localizedDescription])
        return
      }

      NSLog("Deleted assets and updates from SQLite in %f ms", [beginDeleteFromDatabase.timeIntervalSinceNow * -1000])

      FileDownloader.assetFilesQueue.async {
        var deletedAssets = 0
        var erroredAssets: [UpdateAsset] = []

        let beginDeleteAssets = Date()
        for asset in assetsForDeletion {
          let localUrl = directory.appendingPathComponent(asset.filename)
          if FileManager.default.fileExists(atPath: localUrl.path) {
            do {
              try FileManager.default.removeItem(at: localUrl)
              deletedAssets += 1
            } catch {
              NSLog("Error deleting asset at %@: %@", [localUrl, error.localizedDescription])
              erroredAssets.append(asset)
            }
          } else {
            deletedAssets += 1
          }
        }
        NSLog("Deleted %lu assets from disk in %f ms", [deletedAssets, beginDeleteAssets.timeIntervalSinceNow * -1000])

        // retry errored deletions
        let beginRetryDeletes = Date()
        for asset in erroredAssets {
          let localUrl = directory.appendingPathComponent(asset.filename)
          if FileManager.default.fileExists(atPath: localUrl.path) {
            do {
              try FileManager.default.removeItem(at: localUrl)
            } catch {
              NSLog("Retried deleting asset at %@ and failed again: %@", [localUrl, error.localizedDescription])
            }
          }
        }
        NSLog("Retried deleting assets from disk in %f ms", [beginRetryDeletes.timeIntervalSinceNow * -1000])
      }
    }
  }
}
