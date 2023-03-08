//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class EXUpdatesBuildDataSpec : ExpoSpec {
  override func spec() {
    let scopeKey = "test"

    var testDatabaseDir: URL!
    var db: EXUpdatesDatabase!
    var manifest: EXManifestsNewManifest!
    var configChannelTestDictionary: [String: Any]!
    var configChannelTest: EXUpdatesConfig!
    var configChannelTestTwoDictionary: [String: Any]!
    var configChannelTestTwo: EXUpdatesConfig!
    var configReleaseChannelTestDictionary: [String: Any]!
    var configReleaseChannelTest: EXUpdatesConfig!
    var configReleaseChannelTestTwoDictionary: [String: Any]!
    var configReleaseChannelTestTwo: EXUpdatesConfig!
    
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

      configChannelTestDictionary = [
        EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
        EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        EXUpdatesConfig.EXUpdatesConfigRequestHeadersKey: ["expo-channel-name":"test"]
      ]
      configChannelTest = EXUpdatesConfig.config(fromDictionary: configChannelTestDictionary)
      
      configChannelTestTwoDictionary = [
        EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
        EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        EXUpdatesConfig.EXUpdatesConfigRequestHeadersKey: ["expo-channel-name":"testTwo"]
      ]
      configChannelTestTwo = EXUpdatesConfig.config(fromDictionary: configChannelTestTwoDictionary)

      configReleaseChannelTestDictionary = [
        EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
        EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        EXUpdatesConfig.EXUpdatesConfigReleaseChannelKey: "test",
      ]
      configReleaseChannelTest = EXUpdatesConfig.config(fromDictionary: configReleaseChannelTestDictionary)
      
      configReleaseChannelTestTwoDictionary = [
        EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
        EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        EXUpdatesConfig.EXUpdatesConfigReleaseChannelKey: "testTwo",
      ]
      configReleaseChannelTestTwo = EXUpdatesConfig.config(fromDictionary: configReleaseChannelTestTwoDictionary)
      
      let manifestHeaders = EXUpdatesManifestHeaders(
        protocolVersion: nil,
        serverDefinedHeaders: nil,
        manifestFilters: nil,
        manifestSignature: nil,
        signature: nil
      )
      
      // start every test with an update
      db.databaseQueue.sync {
        let update = EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders,
          extensions: [:],
          config: configChannelTest,
          database: db
        )
        try! db.addUpdate(update)
      }
    }
    
    afterEach {
      db.databaseQueue.sync {
        db.closeDatabase()
      }
      
      try! FileManager.default.removeItem(atPath: testDatabaseDir.path)
    }
    
    describe("clearAllUpdatesFromDatabase") {
      it("clears updates") {
        db.databaseQueue.sync {
          expect(try! db.allUpdates(withConfig: configChannelTest).count) > 0
        }
        
        db.databaseQueue.async {
          EXUpdatesBuildData.clearAllUpdatesAndSetStaticBuildData(database: db, config: configChannelTest, scopeKey: scopeKey)
        }
        
        db.databaseQueue.sync {
          expect(try! db.allUpdates(withConfig: configChannelTest).count) == 0
        }
      }
    }
    
    describe("build data consistency") {
      it("no updates are cleared and build data is set when build data is null") {
        db.databaseQueue.sync {
          expect(try! db.staticBuildData(withScopeKey: scopeKey)).to(beNil())
          expect(try! db.allUpdates(withConfig: configChannelTest).count) == 1
        }
        
        EXUpdatesBuildData.ensureBuildDataIsConsistentAsync(database: db, config: configChannelTest)
        
        db.databaseQueue.sync {
          expect(try! db.staticBuildData(withScopeKey: scopeKey)).toNot(beNil())
          expect(try! db.allUpdates(withConfig: configChannelTest).count) == 1
        }
      }
      
      it("no updates are cleared and build data is not set when build data is consistent with channel") {
        db.databaseQueue.sync {
          expect(try! db.allUpdates(withConfig: configChannelTest).count) == 1
          try! db.setStaticBuildData(EXUpdatesBuildData.getBuildDataFromConfig(configChannelTest), withScopeKey: configChannelTest.scopeKey!)
        }
        
        EXUpdatesBuildData.ensureBuildDataIsConsistentAsync(database: db, config: configChannelTest)
        
        db.databaseQueue.sync {
          let staticBuildData = try! db.staticBuildData(withScopeKey: scopeKey)
          expect(
            NSDictionary(dictionary: staticBuildData!).isEqual(to: EXUpdatesBuildData.getBuildDataFromConfig(configChannelTest))
          ) == true
          expect(try! db.allUpdates(withConfig: configChannelTest).count) == 1
        }
      }
      
      it("works when build data is consistent with releaseChannel") {
        db.databaseQueue.sync {
          expect(try! db.allUpdates(withConfig: configReleaseChannelTest).count) == 1
          try! db.setStaticBuildData(EXUpdatesBuildData.getBuildDataFromConfig(configReleaseChannelTest), withScopeKey: configReleaseChannelTest.scopeKey!)
        }
        
        EXUpdatesBuildData.ensureBuildDataIsConsistentAsync(database: db, config: configReleaseChannelTest)
        
        db.databaseQueue.sync {
          let staticBuildData = try! db.staticBuildData(withScopeKey: scopeKey)
          expect(
            NSDictionary(dictionary: staticBuildData!).isEqual(to: EXUpdatesBuildData.getBuildDataFromConfig(configReleaseChannelTest))
          ) == true
          expect(try! db.allUpdates(withConfig: configReleaseChannelTest).count) == 1
        }
      }
      
      it("updates are cleared and build data is set when build data is inconsistent with channel") {
        db.databaseQueue.sync {
          expect(try! db.allUpdates(withConfig: configChannelTest).count) == 1
          try! db.setStaticBuildData(EXUpdatesBuildData.getBuildDataFromConfig(configChannelTest), withScopeKey: configChannelTest.scopeKey!)
        }
        
        EXUpdatesBuildData.ensureBuildDataIsConsistentAsync(database: db, config: configChannelTestTwo)
        
        db.databaseQueue.sync {
          let staticBuildData = try! db.staticBuildData(withScopeKey: scopeKey)
          expect(
            NSDictionary(dictionary: staticBuildData!).isEqual(to: EXUpdatesBuildData.getBuildDataFromConfig(configChannelTestTwo))
          ) == true
          expect(try! db.allUpdates(withConfig: configChannelTestTwo).count) == 0
        }
      }
      
      it("works build data is inconsistent release channel") {
        db.databaseQueue.sync {
          expect(try! db.allUpdates(withConfig: configReleaseChannelTest).count) == 1
          try! db.setStaticBuildData(EXUpdatesBuildData.getBuildDataFromConfig(configReleaseChannelTest), withScopeKey: configChannelTest.scopeKey!)
        }
        
        EXUpdatesBuildData.ensureBuildDataIsConsistentAsync(database: db, config: configReleaseChannelTestTwo)
        
        db.databaseQueue.sync {
          let staticBuildData = try! db.staticBuildData(withScopeKey: scopeKey)
          expect(
            NSDictionary(dictionary: staticBuildData!).isEqual(to: EXUpdatesBuildData.getBuildDataFromConfig(configReleaseChannelTestTwo))
          ) == true
          expect(try! db.allUpdates(withConfig: configReleaseChannelTestTwo).count) == 0
        }
      }
    }
  }
}
