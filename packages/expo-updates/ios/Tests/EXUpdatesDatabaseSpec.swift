//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore
import EXManifests

@testable import EXUpdates

class EXUpdatesDatabaseSpec : ExpoSpec {
  override func spec() {
    var testDatabaseDir: URL!
    var db: EXUpdatesDatabase!
    var manifest: EXManifestsNewManifest!
    var config: EXUpdatesConfig!
    
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
      
      manifest = EXManifestsNewManifest(rawManifestJSON: [
        "runtimeVersion": "1",
        "id": "0eef8214-4833-4089-9dff-b4138a14f196",
        "createdAt": "2020-11-11T00:17:54.797Z",
        "launchAsset": ["url": "https://url.to/bundle.js", "contentType": "application/javascript"]
      ])

      config = EXUpdatesConfig.config(fromDictionary: [
        EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test"
      ])
    }
    
    afterEach {
      db.databaseQueue.sync {
        db.closeDatabase()
      }
      
      try! FileManager.default.removeItem(atPath: testDatabaseDir.path)
    }
    
    describe("foreign keys") {
      it("throws upon foreign key error") {
        let manifestHeaders = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: nil,
          manifestSignature: nil,
          signature: nil
        )
        let update = EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders,
          extensions: [:],
          config: config,
          database: db
        )
        
        db.databaseQueue.sync {
          try! db.addUpdate(update)
          
          let sql = """
            INSERT OR REPLACE INTO updates_assets ("update_id", "asset_id") VALUES (?1, ?2)
          """
          expect {
            try db.execute(sql: sql, withArgs: [update.updateId, 47])
          }.to(throwError(errorType: EXUpdatesDatabaseUtilsError.self) { error in
            expect(error.info?.extendedCode) == 787 // SQLITE_CONSTRAINT_FOREIGNKEY
          })
        }
      }
    }
    
    describe("setMetadata") {
      it("overwrites all fields") {
        let manifestHeaders1 = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: "branch-name=\"rollout-1\",test=\"value\"",
          manifestSignature: nil,
          signature: nil
        )
        let update1 = EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders1,
          extensions: [:],
          config: config,
          database: db
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withManifest: update1)
        }
        
        let manifestHeaders2 = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: "branch-name=\"rollout-2\"",
          manifestSignature: nil,
          signature: nil
        )
        let update2 = EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders2,
          extensions: [:],
          config: config,
          database: db
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withManifest: update2)
        }
        
        db.databaseQueue.sync {
          let expected = ["branch-name": "rollout-2"]
          let actual = try! db.manifestFilters(withScopeKey: update2.scopeKey)
          expect(NSDictionary(dictionary: actual!).isEqual(to: expected)) == true
        }
      }
      
      it("overwrites with empty") {
        let manifestHeaders1 = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: "branch-name=\"rollout-1\"",
          manifestSignature: nil,
          signature: nil
        )
        let update1 = EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders1,
          extensions: [:],
          config: config,
          database: db
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withManifest: update1)
        }
        
        let manifestHeaders2 = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: "",
          manifestSignature: nil,
          signature: nil
        )
        let update2 = EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders2,
          extensions: [:],
          config: config,
          database: db
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withManifest: update2)
        }
        
        db.databaseQueue.sync {
          let expected = [:]
          let actual = try! db.manifestFilters(withScopeKey: update2.scopeKey)
          expect(NSDictionary(dictionary: actual!).isEqual(to: expected)) == true
        }
      }
      
      it("does not overwrite with nil") {
        let manifestHeaders1 = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: "branch-name=\"rollout-1\"",
          manifestSignature: nil,
          signature: nil
        )
        let update1 = EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders1,
          extensions: [:],
          config: config,
          database: db
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withManifest: update1)
        }
        
        let manifestHeaders2 = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: nil,
          manifestSignature: nil,
          signature: nil
        )
        let update2 = EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders2,
          extensions: [:],
          config: config,
          database: db
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withManifest: update2)
        }
        
        db.databaseQueue.sync {
          let expected = ["branch-name": "rollout-1"]
          let actual = try! db.manifestFilters(withScopeKey: update2.scopeKey)
          expect(NSDictionary(dictionary: actual!).isEqual(to: expected)) == true
        }
      }
    }
    
    describe("delete unused assets") {
      it("works for duplicate filenames") {
        func createMockAssetWithKey(key: String) -> EXUpdatesAsset {
          let asset = EXUpdatesAsset(key: key, type: "png")
          asset.downloadTime = Date()
          asset.contentHash = key
          asset.filename = "\(key).png"
          return asset
        }
        
        let manifest1 = EXManifestsNewManifest(rawManifestJSON: [
          "runtimeVersion": "1",
          "id": "0eef8214-4833-4089-9dff-b4138a14f196",
          "createdAt": "2020-11-11T00:17:54.797Z",
          "launchAsset": ["url": "https://url.to/bundle1.js", "contentType": "application/javascript"]
        ])
        let manifest2 = EXManifestsNewManifest(rawManifestJSON: [
          "runtimeVersion": "1",
          "id": "0eef8214-4833-4089-9dff-b4138a14f197",
          "createdAt": "2020-11-11T00:17:55.797Z",
          "launchAsset": ["url": "https://url.to/bundle2.js", "contentType": "application/javascript"]
        ])
        
        let asset1 = createMockAssetWithKey(key: "key1")
        let asset2 = createMockAssetWithKey(key: "key2")
        let asset3 = createMockAssetWithKey(key: "key3")
        
        // simulate two assets with different keys that share a file on disk
        // this can happen if we, for example, change the format of asset keys that we serve
        asset2.filename = "same-filename.png"
        asset3.filename = "same-filename.png"
        
        let manifestHeaders = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: nil,
          manifestSignature: nil,
          signature: nil
        )
        let update1 = EXUpdatesNewUpdate.update(
          withNewManifest: manifest1,
          manifestHeaders: manifestHeaders,
          extensions: [:],
          config: config,
          database: db
        )
        let update2 = EXUpdatesNewUpdate.update(
          withNewManifest: manifest2,
          manifestHeaders: manifestHeaders,
          extensions: [:],
          config: config,
          database: db
        )
        
        db.databaseQueue.sync {
          try! db.addUpdate(update1)
          try! db.addUpdate(update2)
          try! db.addNewAssets([asset1, asset2], toUpdateWithId: update1.updateId)
          try! db.addNewAssets([asset3], toUpdateWithId: update2.updateId)
          
          expect(try! db.allAssets().count) == 3 // two bundles and asset1 and asset2
          
          // simulate update1 being reaped, update2 being kept
          try! db.deleteUpdates([update1])
          
          expect(try! db.allAssets().count) == 3 // two bundles and asset1 and asset2 (not reaped yet)
          
          let deletedAssets = try! db.deleteUnusedAssets()
          
          // asset1 should have been deleted, but asset2 should have been kept
          // since it shared a filename with asset3, which is still in use
          expect(deletedAssets.count) == 1
          expect(deletedAssets.allSatisfy({ asset in
            asset.key == "key1"
          })) == true
          
          expect(try! db.asset(withKey: "key1")).to(beNil())
          expect(try! db.asset(withKey: "key2")).toNot(beNil())
          expect(try! db.asset(withKey: "key3")).toNot(beNil())
        }
      }
    }
  }
}
