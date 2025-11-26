//  Copyright (c) 2024 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore
import EXManifests

@testable import EXUpdates

class AppLauncherAssetValidationSpec : ExpoSpec {
  override class func spec() {
    var testDatabaseDir: URL!
    var db: UpdatesDatabase!
    var config: UpdatesConfig!

    beforeEach {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("AppLauncherAssetValidationTests")

      try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

      if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
        try! FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
      }

      db = UpdatesDatabase()
      db.databaseQueue.sync {
        try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
      }

      config = try! UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigScopeKeyKey: "dummyScope",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        UpdatesConfig.EXUpdatesConfigHasEmbeddedUpdateKey: false
      ])
    }

    afterEach {
      db.databaseQueue.sync {
        db.closeDatabase()
      }

      try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
    }

    describe("asset validation with size mismatch") {
      it("detects size mismatch for corrupted files") {
        // Create an update with a launch asset
        let testUpdate = Update(
          manifest: ManifestFactory.manifest(forManifestJSON: [:]),
          config: config,
          database: db,
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

        let asset = UpdateAsset(key: "bundle-123", type: "js")
        asset.isLaunchAsset = true
        asset.filename = "corrupted-bundle.js"
        asset.downloadTime = Date()
        asset.contentHash = "expected-hash"
        asset.expectedSize = NSNumber(value: 72728472)
        asset.url = nil // No download URL - recovery will fail

        let assetPath = testDatabaseDir.appendingPathComponent(asset.filename)
        let corruptedSize = 61063168
        let corruptedData = Data(repeating: 0, count: corruptedSize)
        try! corruptedData.write(to: assetPath)

        db.databaseQueue.sync {
          try! db.addUpdate(testUpdate, config: config)
          try! db.addNewAssets([asset], toUpdateWithId: testUpdate.updateId)
        }

        var reloadedUpdate: Update?
        db.databaseQueue.sync {
          reloadedUpdate = try! db.update(withId: testUpdate.updateId, config: config)
        }

        let launcher = AppLauncherWithDatabase(
          config: config,
          database: db,
          directory: testDatabaseDir,
          completionQueue: DispatchQueue.global(qos: .default),
          logger: UpdatesLogger()
        )

        launcher.launchedUpdate = reloadedUpdate

        let successValue = Synchronized<Bool>(false)
        let launchAssetUrlValue = Synchronized<URL?>(nil)

        launcher.launchUpdate(withSelectionPolicy: SelectionPolicyFactory.filterAwarePolicy(withRuntimeVersion: "1", config: config)) { error, success in
          successValue.value = success
          launchAssetUrlValue.value = launcher.launchAssetUrl
        }

        // The file should be detected as invalid due to size mismatch
        // Since we can't download or copy from embedded, launch should fail
        expect(successValue.value).toEventually(beFalse(), timeout: .seconds(5))
        expect(launchAssetUrlValue.value).toEventually(beNil(), timeout: .seconds(5))

        expect(FileManager.default.fileExists(atPath: assetPath.path)).toEventually(beFalse(), timeout: .seconds(5))
      }
    }

    describe("asset validation with correct size") {
      it("accepts file when size matches") {
        let testUpdate = Update(
          manifest: ManifestFactory.manifest(forManifestJSON: [:]),
          config: config,
          database: db,
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

        let asset = UpdateAsset(key: "bundle-456", type: "js")
        asset.isLaunchAsset = true
        asset.filename = "valid-bundle.js"
        asset.downloadTime = Date()

        let content = "function test() { return 'hello'; }"
        let assetPath = testDatabaseDir.appendingPathComponent(asset.filename)
        try! content.write(to: assetPath, atomically: true, encoding: .utf8)

        let data = content.data(using: .utf8)!
        asset.expectedSize = NSNumber(value: data.count)
        asset.contentHash = UpdatesUtils.hexEncodedSHA256WithData(data)

        db.databaseQueue.sync {
          try! db.addUpdate(testUpdate, config: config)
          try! db.addNewAssets([asset], toUpdateWithId: testUpdate.updateId)
        }
        var reloadedUpdate: Update?
        db.databaseQueue.sync {
          reloadedUpdate = try! db.update(withId: testUpdate.updateId, config: config)
        }

        let launcher = AppLauncherWithDatabase(
          config: config,
          database: db,
          directory: testDatabaseDir,
          completionQueue: DispatchQueue.global(qos: .default),
          logger: UpdatesLogger()
        )

        launcher.launchedUpdate = reloadedUpdate

        let successValue = Synchronized<Bool>(false)

        launcher.launchUpdate(withSelectionPolicy: SelectionPolicyFactory.filterAwarePolicy(withRuntimeVersion: "1", config: config)) { error, success in
          successValue.value = success
        }

        // Launch should succeed
        expect(successValue.value).toEventually(beTrue(), timeout: .seconds(5))

        // The file should still exist
        let fileStillExists = FileManager.default.fileExists(atPath: assetPath.path)
        expect(fileStillExists) == true
      }
    }

    describe("backward compatibility with old assets") {
      it("validates old assets without expected size") {
        let testUpdate = Update(
          manifest: ManifestFactory.manifest(forManifestJSON: [:]),
          config: config,
          database: db,
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

        let asset = UpdateAsset(key: "old-bundle", type: "js")
        asset.isLaunchAsset = true
        asset.filename = "old-bundle.js"
        asset.downloadTime = Date()
        asset.expectedSize = nil

        let content = "old bundle content"
        let assetPath = testDatabaseDir.appendingPathComponent(asset.filename)
        try! content.write(to: assetPath, atomically: true, encoding: .utf8)

        let data = content.data(using: .utf8)!
        asset.contentHash = UpdatesUtils.hexEncodedSHA256WithData(data)

        db.databaseQueue.sync {
          try! db.addUpdate(testUpdate, config: config)
          try! db.addNewAssets([asset], toUpdateWithId: testUpdate.updateId)
        }

        var reloadedUpdate: Update?
        db.databaseQueue.sync {
          reloadedUpdate = try! db.update(withId: testUpdate.updateId, config: config)
        }

        let launcher = AppLauncherWithDatabase(
          config: config,
          database: db,
          directory: testDatabaseDir,
          completionQueue: DispatchQueue.global(qos: .default),
          logger: UpdatesLogger()
        )

        launcher.launchedUpdate = reloadedUpdate

        let successValue = Synchronized<Bool>(false)

        launcher.launchUpdate(withSelectionPolicy: SelectionPolicyFactory.filterAwarePolicy(withRuntimeVersion: "1", config: config)) { error, success in
          successValue.value = success
        }

        expect(successValue.value).toEventually(beTrue(), timeout: .seconds(5))
      }
    }
  }
}

/// Allows for synchronization pertaining to the file scope.
private final class Synchronized<T> {
  private var _storage: T
  private let lock = NSLock()

  /// Thread safe access here.
  var value: T {
    get {
      return lockAround {
        _storage
      }
    }
    set {
      lockAround {
        _storage = newValue
      }
    }
  }

  init(_ storage: T) {
    self._storage = storage
  }

  private func lockAround<U>(_ closure: () -> U) -> U {
    lock.lock()
    defer { lock.unlock() }
    return closure()
  }
}
