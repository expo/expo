//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class FileDownloaderSpec : ExpoSpec {
  override func spec() {
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
    
    describe("cache control") {
      it("works for legacy manifest") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = FileDownloader(config: config)
        let actual = downloader.createManifestRequest(withURL: URL(string: "https://exp.host/@test/test")!, extraHeaders: nil)
        expect(actual.cachePolicy) == .useProtocolCachePolicy
        expect(actual.value(forHTTPHeaderField: "Cache-Control")).to(beNil())
      }
      
      it("works for new manifest") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = FileDownloader(config: config)
        let actual = downloader.createManifestRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: nil)
        expect(actual.cachePolicy) == .useProtocolCachePolicy
        expect(actual.value(forHTTPHeaderField: "Cache-Control")).to(beNil())
      }
    }
    
    describe("extra headers") {
      it("works for object types") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = FileDownloader(config: config)
        let extraHeaders = [
          "expo-string": "test",
          "expo-number": 47.5,
          "expo-boolean": true,
          "expo-null": nil,
          "expo-nsnull": NSNull()
        ]
        let actual = downloader.createManifestRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)
        
        expect(actual.value(forHTTPHeaderField: "expo-string")) == "test"
        expect(actual.value(forHTTPHeaderField: "expo-number")) == "47.5"
        expect(actual.value(forHTTPHeaderField: "expo-boolean")) == "true"
        expect(actual.value(forHTTPHeaderField: "expo-null")) == "null"
        expect(actual.value(forHTTPHeaderField: "expo-nsnull")) == "null"
      }
      
      it("override order") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
          UpdatesConfig.EXUpdatesConfigRequestHeadersKey: [
            // custom headers configured at build-time should be able to override preset headers
            "expo-updates-environment": "custom"
          ]
        ])
        let downloader = FileDownloader(config: config)
        
        // serverDefinedHeaders should not be able to override preset headers
        let extraHeaders = [
          "expo-platform": "android"
        ]
        
        let actual = downloader.createManifestRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)
        
        expect(actual.value(forHTTPHeaderField: "expo-platform")) == "ios"
        expect(actual.value(forHTTPHeaderField: "expo-updates-environment")) == "custom"
      }
    }
    
    describe("get extra headers") {
      it("works") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        ])
        
        let launchedUpdateUUIDString = "7c1d2bd0-f88b-454d-998c-7fa92a924dbf"
        let launchedUpdate = Update(
          manifest: ManifestFactory.manifest(forManifestJSON: [:]),
          config: config,
          database: db,
          updateId: UUID(uuidString: launchedUpdateUUIDString)!,
          scopeKey: "test",
          commitTime: Date(),
          runtimeVersion: "1.0",
          keep: true,
          status: .Status0_Unused,
          isDevelopmentMode: false,
          assetsFromManifest: []
        )
        
        let embeddedUpdateUUIDString = "9433b1ed-4006-46b8-8aa7-fdc7eeb203fd"
        let embeddedUpdate = Update(
          manifest: ManifestFactory.manifest(forManifestJSON: [:]),
          config: config,
          database: db,
          updateId: UUID(uuidString: embeddedUpdateUUIDString)!,
          scopeKey: "test",
          commitTime: Date(),
          runtimeVersion: "1.0",
          keep: true,
          status: .Status0_Unused,
          isDevelopmentMode: false,
          assetsFromManifest: []
        )
        
        db.databaseQueue.sync {
          try! db.setExtraParam(key: "hello", value: "world", withScopeKey: config.scopeKey!)
          try! db.setExtraParam(key: "what", value: "123", withScopeKey: config.scopeKey!)

          let extraHeaders = FileDownloader.extraHeadersForRemoteUpdateRequest(
            withDatabase: db,
            config: config,
            launchedUpdate: launchedUpdate,
            embeddedUpdate: embeddedUpdate
          )
          expect(extraHeaders["Expo-Current-Update-ID"] as? String) == launchedUpdateUUIDString
          expect(extraHeaders["Expo-Embedded-Update-ID"] as? String) == embeddedUpdateUUIDString
          expect(extraHeaders["Expo-Extra-Params"] as? String).to(contain("what=\"123\""))
          expect(extraHeaders["Expo-Extra-Params"] as? String).to(contain("hello=\"world\""))
        }
      }
      
      it("no launched or embedded update") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        ])
        
        db.databaseQueue.sync {
          let extraHeaders = FileDownloader.extraHeadersForRemoteUpdateRequest(
            withDatabase: db,
            config: config,
            launchedUpdate: nil,
            embeddedUpdate: nil
          )
          expect(extraHeaders["Expo-Current-Update-ID"]).to(beNil())
          expect(extraHeaders["Expo-Embedded-Update-ID"]).to(beNil())
          expect(extraHeaders["Expo-Extra-Params"]).to(beNil())
        }
      }
    }
    
    describe("asset extra headers") {
      it("override order") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
          UpdatesConfig.EXUpdatesConfigRequestHeadersKey: [
            // custom headers configured at build-time should be able to override preset headers
            "expo-updates-environment": "custom"
          ]
        ])
        let downloader = FileDownloader(config: config)
        
        // serverDefinedHeaders should not be able to override preset headers
        let extraHeaders = [
          "expo-platform": "android"
        ]
        
        let actual = downloader.createGenericRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)
        
        expect(actual.value(forHTTPHeaderField: "expo-platform")) == "ios"
        expect(actual.value(forHTTPHeaderField: "expo-updates-environment")) == "custom"
      }
      
      it("object types") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = FileDownloader(config: config)
        let extraHeaders = [
          "expo-string": "test",
          "expo-number": 47.5,
          "expo-boolean": true,
          "expo-null": nil,
          "expo-nsnull": NSNull()
        ]
        let actual = downloader.createGenericRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)
        
        expect(actual.value(forHTTPHeaderField: "expo-string")) == "test"
        expect(actual.value(forHTTPHeaderField: "expo-number")) == "47.5"
        expect(actual.value(forHTTPHeaderField: "expo-boolean")) == "true"
        expect(actual.value(forHTTPHeaderField: "expo-null")) == "null"
        expect(actual.value(forHTTPHeaderField: "expo-nsnull")) == "null"
      }
    }
  }
}
