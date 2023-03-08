//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class EXUpdatesAppLauncherWithDatabaseMock : EXUpdatesAppLauncherWithDatabase {
  public static let testUpdate: EXUpdatesUpdate = {
    return EXUpdatesUpdate(
      manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
      config: EXUpdatesConfig.config(fromDictionary: [:]),
      database: EXUpdatesDatabase(),
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
  
  override func launchableUpdate(selectionPolicy: EXUpdatesSelectionPolicy, completion: @escaping EXUpdatesAppLauncherUpdateCompletionBlock) {
    completion(nil, EXUpdatesAppLauncherWithDatabaseMock.testUpdate)
  }
  
  override func ensureAllAssetsExist() {
    self.completionQueue.async {
      self.completion!(nil, true)
    }
  }
}

class EXUpdatesAppLauncherWithDatabaseSpec : ExpoSpec {
  override func spec() {
    var testDatabaseDir: URL!
    var db: EXUpdatesDatabase!
    
    beforeEach {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("EXUpdatesDatabaseTests")
      
      try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
      
      if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
        try! FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
      }
      
      db = EXUpdatesDatabase()
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
    
    describe("get stored updates") {
      func getStoredUpdatesInTestDB() -> [UUID] {
        var storedUpdateIds: [UUID] = []
        let semaphore = DispatchSemaphore(value: 0)
        EXUpdatesAppLauncherWithDatabase.storedUpdateIds(inDatabase: db) { error, storedUpdateIdsInner in
          storedUpdateIds = storedUpdateIdsInner!
          semaphore.signal()
        }
        _ = semaphore.wait(timeout: DispatchTime.now() + .seconds(5))
        return storedUpdateIds
      }
      
      it("works in empty db") {
        let storedUpdateIds = getStoredUpdatesInTestDB()
        expect(storedUpdateIds.count) == 0
      }
      
      it("gets correct ids") {
        let testUpdate = EXUpdatesAppLauncherWithDatabaseMock.testUpdate
        let yesterday = Date(timeIntervalSinceNow: 24 * 60 * 60 * -1)
        testUpdate.lastAccessed = yesterday
        db.databaseQueue.sync {
          try! db.addUpdate(testUpdate)
        }
        
        let storedUpdateIds = getStoredUpdatesInTestDB()
        expect(storedUpdateIds.count) == 1
        expect(storedUpdateIds.first!.uuidString) == testUpdate.updateId.uuidString
      }
    }
    
    describe("launch update") {
      it("works") {
        let testUpdate = EXUpdatesAppLauncherWithDatabaseMock.testUpdate
        let yesterday = Date(timeIntervalSinceNow: 24 * 60 * 60 * -1)
        testUpdate.lastAccessed = yesterday
        db.databaseQueue.sync {
          try! db.addUpdate(testUpdate)
        }
        
        let testAsset = EXUpdatesAsset(key: "bundle-1234", type: "js")
        testAsset.isLaunchAsset = true
        testAsset.downloadTime = Date()
        testAsset.contentHash = "blah"
        db.databaseQueue.sync {
          try! db.addNewAssets([testAsset], toUpdateWithId: testUpdate.updateId)
        }
        
        let config = EXUpdatesConfig.config(fromDictionary: [EXUpdatesConfig.EXUpdatesConfigScopeKeyKey:"dummyScope"])
        let launcher = EXUpdatesAppLauncherWithDatabaseMock(
          config: config,
          database: db,
          directory: testDatabaseDir,
          completionQueue: DispatchQueue.global(qos: .default)
        )
        var successValue: Bool? = nil
        launcher.launchUpdate(withSelectionPolicy: EXUpdatesSelectionPolicyFactory.filterAwarePolicy(withRuntimeVersion: "1")) { error, success in
          successValue = success
        }
        
        while successValue == nil {
          Thread.sleep(forTimeInterval: 0.1)
        }
        
        expect(successValue) == true
        
        db.databaseQueue.sync {
          let sameUpdate = try! db.update(withId: testUpdate.updateId, config: config)
          expect(yesterday) != sameUpdate?.lastAccessed
          expect(abs(sameUpdate!.lastAccessed.timeIntervalSinceNow)) < 1
        }
      }
    }
  }
}
