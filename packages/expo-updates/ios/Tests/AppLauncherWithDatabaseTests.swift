//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

class AppLauncherWithDatabaseMock: AppLauncherWithDatabase {
  public static let testUpdate: Update = {
    return Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: try! UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      database: UpdatesDatabase(),
      updateId: UUID(),
      scopeKey: "dummyScope",
      commitTime: Date(timeIntervalSince1970: 1608667851),
      runtimeVersion: "1.0",
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: URL(string: "https://example.com"),
      requestHeaders: [:]
    )
  }()

  override func launchableUpdate(selectionPolicy: SelectionPolicy, completion: @escaping AppLauncherUpdateCompletionBlock) {
    completion(nil, AppLauncherWithDatabaseMock.testUpdate)
  }

  override func ensureAllAssetsExist() {
    self.completionQueue.async {
      self.completion!(nil, true)
    }
  }
}

@Suite("AppLauncherWithDatabase", .serialized)
@MainActor
class AppLauncherWithDatabaseTests {
  var testDatabaseDir: URL
  var db: UpdatesDatabase

  init() throws {
    let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
    testDatabaseDir = applicationSupportDir!.appendingPathComponent("AppLauncherWithDatabaseTests")

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

  // MARK: - Launch update

  @Test
  func `launch update works`() async throws {
    let testUpdate = AppLauncherWithDatabaseMock.testUpdate
    let yesterday = Date(timeIntervalSinceNow: 24 * 60 * 60 * -1)
    testUpdate.lastAccessed = yesterday
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "dummyScope",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    db.databaseQueue.sync {
      try! db.addUpdate(testUpdate, config: config)
    }

    let testAsset = UpdateAsset(key: "bundle-1234", type: "js")
    testAsset.isLaunchAsset = true
    testAsset.downloadTime = Date()
    testAsset.contentHash = "blah"
    db.databaseQueue.sync {
      try! db.addNewAssets([testAsset], toUpdateWithId: testUpdate.updateId)
    }

    let launcher = AppLauncherWithDatabaseMock(
      config: config,
      database: db,
      directory: testDatabaseDir,
      completionQueue: DispatchQueue.global(qos: .default),
      logger: UpdatesLogger()
    )

    let success = await withCheckedContinuation { continuation in
      launcher.launchUpdate(withSelectionPolicy: SelectionPolicyFactory.filterAwarePolicy(withRuntimeVersion: "1", config: config)) { error, success in
        continuation.resume(returning: success)
      }
    }

    #expect(success == true)

    db.databaseQueue.sync {
      let sameUpdate = try! db.update(withId: testUpdate.updateId, config: config)
      #expect(yesterday != sameUpdate?.lastAccessed)
      #expect(abs(sameUpdate!.lastAccessed.timeIntervalSinceNow) < 1)
    }
  }
}
