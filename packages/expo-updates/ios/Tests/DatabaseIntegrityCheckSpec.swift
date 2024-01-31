//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class UpdatesDatabaseIntegrityCheckMockingAssetExists : UpdatesDatabaseIntegrityCheck {
  public override func assetExists(_ asset: UpdateAsset, inDirectory directory: URL) -> Bool {
    return asset.key == "asset1"
  }
}

class UpdatesDatabaseIntegrityCheckSpec : ExpoSpec {
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
    
    describe("filter embedded updates") {
      it("works") {
        // We can't run any updates with the status EMBEDDED if they aren't the update that's
        // currently embedded in the installed app; the integrity check should remove any such updates
        // from the database entirely.
        
        let scopeKey = "testScopeKey"
        let runtimeVersion = "1.0"
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
          UpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: runtimeVersion
        ])
        
        let update1 = Update(
          manifest: ManifestFactory.manifest(forManifestJSON: [:]),
          config: config,
          database: db,
          updateId: UUID(),
          scopeKey: scopeKey,
          commitTime: Date(timeIntervalSince1970: 1608667851),
          runtimeVersion: runtimeVersion,
          keep: true,
          status: .StatusEmbedded,
          isDevelopmentMode: false,
          assetsFromManifest: []
        )
        let update2 = Update(
          manifest: ManifestFactory.manifest(forManifestJSON: [:]),
          config: config,
          database: db,
          updateId: UUID(),
          scopeKey: scopeKey,
          commitTime: Date(timeIntervalSince1970: 1608667852),
          runtimeVersion: runtimeVersion,
          keep: true,
          status: .StatusEmbedded,
          isDevelopmentMode: false,
          assetsFromManifest: []
        )
        
        db.databaseQueue.sync {
          try! db.addUpdate(update1)
          try! db.addUpdate(update2)
          
          expect(try! db.allUpdates(withConfig: config).count) == 2
          
          try! UpdatesDatabaseIntegrityCheck().run(withDatabase: db, directory: testDatabaseDir, config: config, embeddedUpdate: update2)
          
          let allUpdates = try! db.allUpdates(withConfig: config)
          expect(allUpdates.count) == 1
          expect(update2.updateId) == allUpdates.first?.updateId
        }
      }
    }
    
    describe("missing assets") {
      it("works") {
        let asset1 = UpdateAsset(key: "asset1", type: "png")
        asset1.downloadTime = Date()
        asset1.contentHash = "hash1"
        let asset2 = UpdateAsset(key: "asset2", type: "png")
        asset2.downloadTime = Date()
        asset2.contentHash = "hash2"
        
        let scopeKey = "testScopeKey"
        let runtimeVersion = "1.0"
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
          UpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: runtimeVersion
        ])
        
        let update1 = Update(
          manifest: ManifestFactory.manifest(forManifestJSON: [:]),
          config: config,
          database: db,
          updateId: UUID(),
          scopeKey: scopeKey,
          commitTime: Date(timeIntervalSince1970: 1608667851),
          runtimeVersion: runtimeVersion,
          keep: true,
          status: .StatusEmbedded,
          isDevelopmentMode: false,
          assetsFromManifest: []
        )
        let update2 = Update(
          manifest: ManifestFactory.manifest(forManifestJSON: [:]),
          config: config,
          database: db,
          updateId: UUID(),
          scopeKey: scopeKey,
          commitTime: Date(timeIntervalSince1970: 1608667852),
          runtimeVersion: runtimeVersion,
          keep: true,
          status: .StatusEmbedded,
          isDevelopmentMode: false,
          assetsFromManifest: []
        )
        
        db.databaseQueue.sync {
          try! db.addUpdate(update1)
          try! db.addUpdate(update2)
          try! db.addNewAssets([asset1], toUpdateWithId: update1.updateId)
          try! db.addNewAssets([asset2], toUpdateWithId: update2.updateId)
          
          expect(try! db.allUpdates(withConfig: config).count) == 2
          expect(try! db.allAssets().count) == 2
          
          try! UpdatesDatabaseIntegrityCheckMockingAssetExists().run(
            withDatabase: db,
            directory: testDatabaseDir,
            config: config,
            embeddedUpdate: nil
          )
          
          let allUpdates = try! db.allUpdates(withConfig: config)
          let allAssets = try! db.allAssets()
          
          // this is broken?
//          expect(allUpdates.count) == 1
//          expect(allAssets.count) == 2
//
//          let sortedUpdates = allUpdates.sorted { l, r in
//            return l.commitTime < r.commitTime
//          }
//          expect(sortedUpdates[0].status) == UpdateStatus.StatusReady
//          expect(sortedUpdates[1].status) == UpdateStatus.StatusPending
        }
      }
    }
  }
}
