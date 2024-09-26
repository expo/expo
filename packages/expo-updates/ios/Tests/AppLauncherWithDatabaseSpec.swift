//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class AppLauncherWithDatabaseMock : AppLauncherWithDatabase {
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
      assetsFromManifest: []
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

class AppLauncherWithDatabaseSpec : ExpoSpec {
  override class func spec() {
    var testDatabaseDir: URL!
    var db: UpdatesDatabase!

    beforeEach {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("UpdatesDatabaseTests")

      try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

      if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
        try! FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
      }

      db = UpdatesDatabase()
      db.databaseQueue.sync {
        try! db.openDatabase(inDirectory: testDatabaseDir)
      }
    }

    afterEach {
      db.databaseQueue.sync {
        db.closeDatabase()
      }

      try! FileManager.default.removeItem(atPath: testDatabaseDir.path)
    }

    describe("launch update") {
      it("works") {
        let testUpdate = AppLauncherWithDatabaseMock.testUpdate
        let yesterday = Date(timeIntervalSinceNow: 24 * 60 * 60 * -1)
        testUpdate.lastAccessed = yesterday
        db.databaseQueue.sync {
          try! db.addUpdate(testUpdate)
        }

        let testAsset = UpdateAsset(key: "bundle-1234", type: "js")
        testAsset.isLaunchAsset = true
        testAsset.downloadTime = Date()
        testAsset.contentHash = "blah"
        db.databaseQueue.sync {
          try! db.addNewAssets([testAsset], toUpdateWithId: testUpdate.updateId)
        }

        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
          UpdatesConfig.EXUpdatesConfigScopeKeyKey: "dummyScope",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ])
        let launcher = AppLauncherWithDatabaseMock(
          config: config,
          database: db,
          directory: testDatabaseDir,
          completionQueue: DispatchQueue.global(qos: .default)
        )
        let successValue = Synchronized<Bool?>(nil)
        launcher.launchUpdate(withSelectionPolicy: SelectionPolicyFactory.filterAwarePolicy(withRuntimeVersion: "1")) { error, success in
          successValue.value = success
        }
        expect(successValue.value).toEventually(beTrue(), timeout: .milliseconds(10_000))

        db.databaseQueue.sync {
          let sameUpdate = try! db.update(withId: testUpdate.updateId, config: config)
          expect(yesterday) != sameUpdate?.lastAccessed
          expect(abs(sameUpdate!.lastAccessed.timeIntervalSinceNow)) < 1
        }
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
