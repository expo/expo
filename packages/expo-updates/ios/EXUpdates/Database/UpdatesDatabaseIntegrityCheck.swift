// Copyright 2021-present 650 Industries. All rights reserved.

import Foundation

internal class UpdatesDatabaseIntegrityCheck {
  func run(
    withDatabase database: UpdatesDatabase,
    directory: URL,
    config: UpdatesConfig,
    embeddedUpdate: Update?
  ) throws {
    let assets = try database.allAssets()
    var missingAssets: [UpdateAsset] = []
    FileDownloader.assetFilesQueue.sync {
      for asset in assets where !assetExists(asset, inDirectory: directory) {
        missingAssets.append(asset)
      }
    }

    if !missingAssets.isEmpty {
      try database.markMissingAssets(missingAssets)
    }

    let updatesWithEmbeddedStatus = try database.allUpdates(withStatus: .StatusEmbedded, config: config)
    let updatesToDelete = updatesWithEmbeddedStatus.filter { update in
      guard let embeddedUpdate = embeddedUpdate else {
        return true
      }
      return update.updateId != embeddedUpdate.updateId
    }

    if !updatesToDelete.isEmpty {
      try database.deleteUpdates(updatesToDelete)
    }
  }

  func assetExists(_ asset: UpdateAsset, inDirectory directory: URL) -> Bool {
    return FileManager.default.fileExists(atPath: directory.appendingPathComponent(asset.filename).path)
  }
}
