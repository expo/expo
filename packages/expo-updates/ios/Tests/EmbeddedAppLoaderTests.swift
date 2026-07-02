//  Copyright (c) 2024 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

@Suite("EmbeddedAppLoader", .serialized)
@MainActor
class EmbeddedAppLoaderTests {
  var testDatabaseDir: URL
  var db: UpdatesDatabase

  init() throws {
    let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
    testDatabaseDir = applicationSupportDir!.appendingPathComponent("EmbeddedAppLoaderTests")

    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

    if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
      try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
    }

    db = UpdatesDatabase()
    db.databaseQueue.sync {
      try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
    }
  }

  deinit {
    db.databaseQueue.sync {
      db.closeDatabase()
    }
    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
  }

  @Test
  func `no-copy registers the embedded update without ingesting non-launch assets`() async throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "dummyScope",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])

    // Build an embedded update with a couple of non-launch assets without touching the app bundle,
    // mirroring UpdateTests' `works for embedded bare manifest`.
    let embeddedManifestJSON: [String: Any] = [
      "id": "0eef8214-4833-4089-9dff-b4138a14f196",
      "commitTime": 1609975977832,
      "assets": [
        ["packagerHash": "embedded-asset-1", "type": "png", "nsBundleFilename": "image1"],
        ["packagerHash": "embedded-asset-2", "type": "png", "nsBundleFilename": "image2"],
      ],
    ]
    let embeddedUpdate = Update.update(
      withRawEmbeddedManifest: embeddedManifestJSON,
      config: config,
      database: db
    )

    let loader = EmbeddedAppLoader(
      config: config,
      logger: UpdatesLogger(),
      database: db,
      directory: testDatabaseDir,
      launchedUpdate: nil,
      completionQueue: DispatchQueue.global(qos: .default)
    )
    loader.shouldCopyEmbeddedAssets = false

    let success: Bool = await withCheckedContinuation { continuation in
      loader.updateResponseBlock = { _ in true }
      loader.assetBlock = { _, _, _, _ in }
      loader.successBlock = { _ in continuation.resume(returning: true) }
      loader.errorBlock = { _ in continuation.resume(returning: false) }
      loader.startEmbeddedLoad(fromEmbeddedManifest: embeddedUpdate)
    }

    #expect(success == true)

    db.databaseQueue.sync {
      // The update row is registered and stays StatusEmbedded (not promoted to StatusReady), so later
      // launches keep resolving it from the app bundle rather than the empty database asset path.
      let storedUpdate = try! db.update(withId: embeddedUpdate.updateId, config: config)
      #expect(storedUpdate != nil)
      #expect(storedUpdate?.status == .StatusEmbedded)

      // Its non-launch assets were not read, hashed, or inserted.
      let asset = try? db.asset(withKey: "embedded-asset-1")
      #expect(asset == nil)
    }
  }
}
