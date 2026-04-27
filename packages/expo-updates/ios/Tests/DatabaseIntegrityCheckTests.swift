//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

class UpdatesDatabaseIntegrityCheckMockingAssetExists: UpdatesDatabaseIntegrityCheck {
  public override func assetExists(_ asset: UpdateAsset, inDirectory directory: URL) -> Bool {
    return asset.key == "asset1"
  }
}

@Suite("DatabaseIntegrityCheck", .serialized)
@MainActor
struct DatabaseIntegrityCheckTests {
  var testDatabaseDir: URL
  var db: UpdatesDatabase

  init() throws {
    let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last!
    testDatabaseDir = applicationSupportDir.appendingPathComponent("DatabaseIntegrityCheckTests")

    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

    if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
      try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
    }

    db = UpdatesDatabase()
    db.databaseQueue.sync {
      try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
    }
  }

  // Cleanup is not automatic in Swift Testing structs, but each test gets a fresh init().
  // The init above removes the directory before recreating it, so cleanup is handled.

  private func makeConfig(scopeKey: String = "testScopeKey", runtimeVersion: String = "1.0") throws -> UpdatesConfig {
    return try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: runtimeVersion
    ])
  }

  private func makeUpdate(config: UpdatesConfig, scopeKey: String = "testScopeKey", runtimeVersion: String = "1.0", commitTime: Date) -> Update {
    return Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: UUID(),
      scopeKey: scopeKey,
      commitTime: commitTime,
      runtimeVersion: runtimeVersion,
      keep: true,
      status: .StatusEmbedded,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: URL(string: "https://example.com"),
      requestHeaders: [:]
    )
  }

  @Test
  func filterEmbeddedUpdates() throws {
    let config = try makeConfig()
    let update1 = makeUpdate(config: config, commitTime: Date(timeIntervalSince1970: 1608667851))
    let update2 = makeUpdate(config: config, commitTime: Date(timeIntervalSince1970: 1608667852))

    db.databaseQueue.sync {
      try! db.addUpdate(update1, config: config)
      try! db.addUpdate(update2, config: config)

      #expect(try! db.allUpdates(withConfig: config).count == 2)

      try! UpdatesDatabaseIntegrityCheck().run(withDatabase: db, directory: testDatabaseDir, config: config, embeddedUpdate: update2)

      let allUpdates = try! db.allUpdates(withConfig: config)
      #expect(allUpdates.count == 1)
      #expect(allUpdates.first?.updateId == update2.updateId)
    }
  }

  @Test
  func missingAssets() throws {
    let config = try makeConfig()

    let asset1 = UpdateAsset(key: "asset1", type: "png")
    asset1.downloadTime = Date()
    asset1.contentHash = "hash1"
    let asset2 = UpdateAsset(key: "asset2", type: "png")
    asset2.downloadTime = Date()
    asset2.contentHash = "hash2"

    let update1 = makeUpdate(config: config, commitTime: Date(timeIntervalSince1970: 1608667851))
    let update2 = makeUpdate(config: config, commitTime: Date(timeIntervalSince1970: 1608667852))

    db.databaseQueue.sync {
      try! db.addUpdate(update1, config: config)
      try! db.addUpdate(update2, config: config)
      try! db.addNewAssets([asset1], toUpdateWithId: update1.updateId)
      try! db.addNewAssets([asset2], toUpdateWithId: update2.updateId)

      #expect(try! db.allUpdates(withConfig: config).count == 2)
      #expect(try! db.allAssets().count == 2)

      try! UpdatesDatabaseIntegrityCheckMockingAssetExists().run(
        withDatabase: db,
        directory: testDatabaseDir,
        config: config,
        embeddedUpdate: nil
      )

      // Note: the original spec had these assertions commented out as broken.
      // Keeping them commented for now — the behavior needs investigation.
      // let allUpdates = try! db.allUpdates(withConfig: config)
      // let allAssets = try! db.allAssets()
      // #expect(allUpdates.count == 1)
      // #expect(allAssets.count == 2)
      // let sortedUpdates = allUpdates.sorted { $0.commitTime < $1.commitTime }
      // #expect(sortedUpdates[0].status == .StatusReady)
      // #expect(sortedUpdates[1].status == .StatusPending)
    }
  }
}
