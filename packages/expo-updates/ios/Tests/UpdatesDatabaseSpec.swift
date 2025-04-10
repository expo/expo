//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore
import EXManifests

@testable import EXUpdates

class UpdatesDatabaseSpec : ExpoSpec {
  override class func spec() {
    var testDatabaseDir: URL!
    var db: UpdatesDatabase!
    var manifest: ExpoUpdatesManifest!
    var config: UpdatesConfig!
    
    beforeEach {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("UpdatesDatabaseTests")
      
      try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
      
      if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
        try! FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
      }
      
      db = UpdatesDatabase()
      db.databaseQueue.sync {
        try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
      }
      
      manifest = ExpoUpdatesManifest(rawManifestJSON: [
        "runtimeVersion": "1",
        "id": "0eef8214-4833-4089-9dff-b4138a14f196",
        "createdAt": "2020-11-11T00:17:54.797Z",
        "launchAsset": ["url": "https://url.to/bundle.js", "contentType": "application/javascript"]
      ])

      config = try! UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
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
        let update = ExpoUpdatesUpdate.update(
          withExpoUpdatesManifest: manifest,
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
          }.to(throwError(errorType: UpdatesDatabaseUtilsError.self) { error in
            expect(error.info?.extendedCode) == 787 // SQLITE_CONSTRAINT_FOREIGNKEY
          })
        }
      }
    }

    describe("setExtraClientParams") {
      it("functions") {
        db.databaseQueue.sync {
          let beforeSave = try! db.extraParams(withScopeKey: "test")
          expect(beforeSave).to(beNil())

          try! db.setExtraParam(key: "wat", value: "hello", withScopeKey: "test")

          let afterSave = try! db.extraParams(withScopeKey: "test")
          expect(NSDictionary(dictionary: afterSave!).isEqual(to: ["wat": "hello"])) == true

          try! db.setExtraParam(key: "wat", value: nil, withScopeKey: "test")

          let afterRemove = try! db.extraParams(withScopeKey: "test")
          expect(NSDictionary(dictionary: afterRemove!).isEqual(to: [:])) == true
        }
      }

      it("validates") {
        db.databaseQueue.sync {
          expect {
            try db.setExtraParam(key: "Hello", value: "World", withScopeKey: "test")
          }.to(throwError(SerializerError.invalidCharacterInKey(key: "Hello", character: "H")))
        }
      }
    }
    
    describe("setMetadata") {
      it("overwrites all fields") {
        let responseHeaderData1 = ResponseHeaderData(
          protocolVersionRaw: nil,
          serverDefinedHeadersRaw: nil,
          manifestFiltersRaw: "branch-name=\"rollout-1\",test=\"value\""
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withResponseHeaderData: responseHeaderData1, scopeKey: "test")
        }
        
        let responseHeaderData2 = ResponseHeaderData(
          protocolVersionRaw: nil,
          serverDefinedHeadersRaw: nil,
          manifestFiltersRaw: "branch-name=\"rollout-2\""
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withResponseHeaderData: responseHeaderData2, scopeKey: "test")
        }
        
        db.databaseQueue.sync {
          let expected = ["branch-name": "rollout-2"]
          let actual = try! db.manifestFilters(withScopeKey: "test")
          expect(NSDictionary(dictionary: actual!).isEqual(to: expected)) == true
        }
      }
      
      it("overwrites with empty") {
        let responseHeaderData1 = ResponseHeaderData(
          protocolVersionRaw: nil,
          serverDefinedHeadersRaw: nil,
          manifestFiltersRaw: "branch-name=\"rollout-1\""
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withResponseHeaderData: responseHeaderData1, scopeKey: "test")
        }
        
        let responseHeaderData2 = ResponseHeaderData(
          protocolVersionRaw: nil,
          serverDefinedHeadersRaw: nil,
          manifestFiltersRaw: ""
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withResponseHeaderData: responseHeaderData2, scopeKey: "test")
        }
        
        db.databaseQueue.sync {
          let expected = [:]
          let actual = try! db.manifestFilters(withScopeKey: "test")
          expect(NSDictionary(dictionary: actual!).isEqual(to: expected)) == true
        }
      }
      
      it("does not overwrite with nil") {
        let responseHeaderData1 = ResponseHeaderData(
          protocolVersionRaw: nil,
          serverDefinedHeadersRaw: nil,
          manifestFiltersRaw: "branch-name=\"rollout-1\""
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withResponseHeaderData: responseHeaderData1, scopeKey: "test")
        }
        
        let responseHeaderData2 = ResponseHeaderData(
          protocolVersionRaw: nil,
          serverDefinedHeadersRaw: nil,
          manifestFiltersRaw: nil
        )
        
        db.databaseQueue.sync {
          try! db.setMetadata(withResponseHeaderData: responseHeaderData2, scopeKey: "test")
        }
        
        db.databaseQueue.sync {
          let expected = ["branch-name": "rollout-1"]
          let actual = try! db.manifestFilters(withScopeKey: "test")
          expect(NSDictionary(dictionary: actual!).isEqual(to: expected)) == true
        }
      }
    }
    
    describe("delete unused assets") {
      it("works for duplicate filenames") {
        func createMockAssetWithKey(key: String) -> UpdateAsset {
          let asset = UpdateAsset(key: key, type: "png")
          asset.downloadTime = Date()
          asset.contentHash = key
          asset.filename = "\(key).png"
          return asset
        }
        
        let manifest1 = ExpoUpdatesManifest(rawManifestJSON: [
          "runtimeVersion": "1",
          "id": "0eef8214-4833-4089-9dff-b4138a14f196",
          "createdAt": "2020-11-11T00:17:54.797Z",
          "launchAsset": ["url": "https://url.to/bundle1.js", "contentType": "application/javascript"]
        ])
        let manifest2 = ExpoUpdatesManifest(rawManifestJSON: [
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
        
        let update1 = ExpoUpdatesUpdate.update(
          withExpoUpdatesManifest: manifest1,
          extensions: [:],
          config: config,
          database: db
        )
        let update2 = ExpoUpdatesUpdate.update(
          withExpoUpdatesManifest: manifest2,
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
