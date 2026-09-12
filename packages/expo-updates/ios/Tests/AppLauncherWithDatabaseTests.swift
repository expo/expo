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

// Overrides only the update selection so ensureAllAssetsExist runs for real.
class AppLauncherRealAssetsMock: AppLauncherWithDatabase {
  static var updateToLaunch: Update?

  override func launchableUpdate(selectionPolicy: SelectionPolicy, completion: @escaping AppLauncherUpdateCompletionBlock) {
    completion(nil, AppLauncherRealAssetsMock.updateToLaunch)
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

    let beforeLaunch = Date(timeIntervalSince1970: floor(Date().timeIntervalSince1970 * 1000) / 1000)
    let success = await withCheckedContinuation { continuation in
      launcher.launchUpdate(withSelectionPolicy: SelectionPolicyFactory.filterAwarePolicy(withRuntimeVersion: "1", config: config)) { error, success in
        continuation.resume(returning: success)
      }
    }

    #expect(success == true)

    db.databaseQueue.sync {
      let sameUpdate = try! db.update(withId: testUpdate.updateId, config: config)
      // `lastAccessed` should have been bumped from yesterday to launch time. Bounding from
      // `beforeLaunch` keeps the assertion valid however long the launch takes on CI.
      #expect(sameUpdate!.lastAccessed >= beforeLaunch)
    }
  }

  // MARK: - missing launch asset

  private func makeConfig() throws -> UpdatesConfig {
    try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "dummyScope",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      UpdatesConfig.EXUpdatesConfigHasEmbeddedUpdateKey: false,
    ])
  }

  private func makeUpdate(config: UpdatesConfig, status: UpdateStatus = .StatusPending) -> Update {
    Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: UUID(),
      scopeKey: "dummyScope",
      commitTime: Date(timeIntervalSince1970: 1608667851),
      runtimeVersion: "1",
      keep: true,
      status: status,
      isDevelopmentMode: false,
      assetsFromManifest: nil,
      url: URL(string: "https://example.com"),
      requestHeaders: [:]
    )
  }

  // resolves nil if the launcher never calls its completion within the timeout
  private func launchOutcome(launcher: AppLauncherWithDatabase, config: UpdatesConfig) async -> (error: UpdatesError?, success: Bool)? {
    final class Once: @unchecked Sendable {
      private var done = false
      private let lock = NSLock()
      func run(_ block: () -> Void) {
        lock.lock()
        defer { lock.unlock() }
        if !done {
          done = true
          block()
        }
      }
    }

    let once = Once()
    return await withCheckedContinuation { continuation in
      launcher.launchUpdate(withSelectionPolicy: SelectionPolicyFactory.filterAwarePolicy(withRuntimeVersion: "1", config: config)) { error, success in
        once.run { continuation.resume(returning: (error, success)) }
      }
      DispatchQueue.global().asyncAfter(deadline: .now() + 10.0) {
        once.run { continuation.resume(returning: nil) }
      }
    }
  }

  @Test
  func `fails with launch asset not found when the update has no assets`() async throws {
    let config = try makeConfig()
    let update = makeUpdate(config: config)

    db.databaseQueue.sync {
      try! db.addUpdate(update, config: config)
      try! db.markUpdateFinished(update)
    }

    AppLauncherRealAssetsMock.updateToLaunch = update
    let launcher = AppLauncherRealAssetsMock(
      config: config,
      database: db,
      directory: testDatabaseDir,
      completionQueue: DispatchQueue.global(qos: .default),
      logger: UpdatesLogger()
    )

    let outcome = await launchOutcome(launcher: launcher, config: config)

    #expect(outcome != nil, "the launcher never invoked its completion")
    #expect(outcome?.success == false)
    if case .appLauncherLaunchAssetNotFound = outcome?.error {
    } else {
      Issue.record("Expected appLauncherLaunchAssetNotFound but got \(String(describing: outcome?.error))")
    }
  }

  @Test
  func `fails with launch asset not found when the launch asset is not linked`() async throws {
    let config = try makeConfig()
    let update = makeUpdate(config: config)

    let imageAsset = UpdateAsset(key: "image-1", type: "png")
    imageAsset.isLaunchAsset = false
    imageAsset.downloadTime = Date()
    imageAsset.contentHash = "imagehash"
    imageAsset.filename = "image-1.png"
    try Data("fake image".utf8).write(to: testDatabaseDir.appendingPathComponent("image-1.png"))

    db.databaseQueue.sync {
      try! db.addUpdate(update, config: config)
      try! db.addNewAssets([imageAsset], toUpdateWithId: update.updateId)
      try! db.markUpdateFinished(update)
    }

    AppLauncherRealAssetsMock.updateToLaunch = update
    let launcher = AppLauncherRealAssetsMock(
      config: config,
      database: db,
      directory: testDatabaseDir,
      completionQueue: DispatchQueue.global(qos: .default),
      logger: UpdatesLogger()
    )

    let outcome = await launchOutcome(launcher: launcher, config: config)

    #expect(outcome != nil, "the launcher never invoked its completion")
    #expect(outcome?.success == false)
    if case .appLauncherLaunchAssetNotFound = outcome?.error {
    } else {
      Issue.record("Expected appLauncherLaunchAssetNotFound but got \(String(describing: outcome?.error))")
    }
  }

  @Test
  func `fails with launch asset not found when the embedded bundle is missing`() async throws {
    let config = try makeConfig()
    // the test bundle contains no embedded bundle resource, so the lookup returns nil
    let update = makeUpdate(config: config, status: .StatusEmbedded)

    AppLauncherRealAssetsMock.updateToLaunch = update
    let launcher = AppLauncherRealAssetsMock(
      config: config,
      database: db,
      directory: testDatabaseDir,
      completionQueue: DispatchQueue.global(qos: .default),
      logger: UpdatesLogger()
    )

    let outcome = await launchOutcome(launcher: launcher, config: config)

    #expect(outcome != nil, "the launcher never invoked its completion")
    #expect(outcome?.success == false)
    if case .appLauncherLaunchAssetNotFound = outcome?.error {
    } else {
      Issue.record("Expected appLauncherLaunchAssetNotFound but got \(String(describing: outcome?.error))")
    }
  }
}
