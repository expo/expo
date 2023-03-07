//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class EXUpdatesFileDownloaderSpec : ExpoSpec {
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
    
    describe("cache control") {
      it("works for legacy manifest") {
        let config = EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          EXUpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = EXUpdatesFileDownloader(config: config)
        let actual = downloader.createManifestRequest(withURL: URL(string: "https://exp.host/@test/test")!, extraHeaders: nil)
        expect(actual.cachePolicy) == .useProtocolCachePolicy
        expect(actual.value(forHTTPHeaderField: "Cache-Control")).to(beNil())
      }
      
      it("works for new manifest") {
        let config = EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          EXUpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = EXUpdatesFileDownloader(config: config)
        let actual = downloader.createManifestRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: nil)
        expect(actual.cachePolicy) == .useProtocolCachePolicy
        expect(actual.value(forHTTPHeaderField: "Cache-Control")).to(beNil())
      }
    }
    
    describe("extra headers") {
      it("works for object types") {
        let config = EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          EXUpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = EXUpdatesFileDownloader(config: config)
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
        let config = EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          EXUpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
          EXUpdatesConfig.EXUpdatesConfigRequestHeadersKey: [
            // custom headers configured at build-time should be able to override preset headers
            "expo-updates-environment": "custom"
          ]
        ])
        let downloader = EXUpdatesFileDownloader(config: config)
        
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
        let config = EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        ])
        
        let launchedUpdateUUIDString = "7c1d2bd0-f88b-454d-998c-7fa92a924dbf"
        let launchedUpdate = EXUpdatesUpdate(
          manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
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
        let embeddedUpdate = EXUpdatesUpdate(
          manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
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
          let extraHeaders = EXUpdatesFileDownloader.extraHeaders(
            withDatabase: db,
            config: config,
            launchedUpdate: launchedUpdate,
            embeddedUpdate: embeddedUpdate
          )
          expect(extraHeaders["Expo-Current-Update-ID"] as? String) == launchedUpdateUUIDString
          expect(extraHeaders["Expo-Embedded-Update-ID"] as? String) == embeddedUpdateUUIDString
        }
      }
      
      it("no launched or embedded update") {
        let config = EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        ])
        
        db.databaseQueue.sync {
          let extraHeaders = EXUpdatesFileDownloader.extraHeaders(
            withDatabase: db,
            config: config,
            launchedUpdate: nil,
            embeddedUpdate: nil
          )
          expect(extraHeaders["Expo-Current-Update-ID"]).to(beNil())
          expect(extraHeaders["Expo-Embedded-Update-ID"]).to(beNil())
        }
      }
    }
    
    describe("asset extra headers") {
      it("override order") {
        let config = EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          EXUpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
          EXUpdatesConfig.EXUpdatesConfigRequestHeadersKey: [
            // custom headers configured at build-time should be able to override preset headers
            "expo-updates-environment": "custom"
          ]
        ])
        let downloader = EXUpdatesFileDownloader(config: config)
        
        // serverDefinedHeaders should not be able to override preset headers
        let extraHeaders = [
          "expo-platform": "android"
        ]
        
        let actual = downloader.createGenericRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)
        
        expect(actual.value(forHTTPHeaderField: "expo-platform")) == "ios"
        expect(actual.value(forHTTPHeaderField: "expo-updates-environment")) == "custom"
      }
      
      it("object types") {
        let config = EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          EXUpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = EXUpdatesFileDownloader(config: config)
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
