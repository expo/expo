//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

@Suite("UpdatesDatabase", .serialized)
class UpdatesDatabaseTests {
  var testDatabaseDir: URL
  var db: UpdatesDatabase
  var manifest: ExpoUpdatesManifest
  var config: UpdatesConfig

  init() throws {
    let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
    testDatabaseDir = applicationSupportDir!.appendingPathComponent("UpdatesDatabaseTests")

    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

    if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
      try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
    }

    db = UpdatesDatabase()

    manifest = ExpoUpdatesManifest(rawManifestJSON: [
      "runtimeVersion": "1",
      "id": "0eef8214-4833-4089-9dff-b4138a14f196",
      "createdAt": "2020-11-11T00:17:54.797Z",
      "launchAsset": ["url": "https://url.to/bundle.js", "contentType": "application/javascript"]
    ])

    config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])

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

  // MARK: - foreign keys

  @Suite("foreign keys", .serialized)
  struct ForeignKeysTests {
    var testDatabaseDir: URL
    var db: UpdatesDatabase
    var manifest: ExpoUpdatesManifest
    var config: UpdatesConfig

    init() throws {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("ForeignKeysTests")

      try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

      if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
        try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
      }

      db = UpdatesDatabase()

      manifest = ExpoUpdatesManifest(rawManifestJSON: [
        "runtimeVersion": "1",
        "id": "0eef8214-4833-4089-9dff-b4138a14f196",
        "createdAt": "2020-11-11T00:17:54.797Z",
        "launchAsset": ["url": "https://url.to/bundle.js", "contentType": "application/javascript"]
      ])

      config = try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ])

      db.databaseQueue.sync {
        try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
      }
    }

    @Test
    func `throws upon foreign key error`() throws {
      let update = ExpoUpdatesUpdate.update(
        withExpoUpdatesManifest: manifest,
        extensions: [:],
        config: config,
        database: db
      )

      db.databaseQueue.sync {
        try! db.addUpdate(update, config: config)

        let sql = """
          INSERT OR REPLACE INTO updates_assets ("update_id", "asset_id") VALUES (?1, ?2)
        """

        do {
          try db.execute(sql: sql, withArgs: [update.updateId, 47])
          Issue.record("Expected to throw UpdatesDatabaseUtilsError")
        } catch let error as UpdatesDatabaseUtilsError {
          #expect(error.info?.extendedCode == 787) // SQLITE_CONSTRAINT_FOREIGNKEY
        } catch {
          Issue.record("Expected UpdatesDatabaseUtilsError but got \(error)")
        }
      }
    }
  }

  // MARK: - setExtraClientParams

  @Suite("setExtraClientParams", .serialized)
  struct SetExtraClientParamsTests {
    var testDatabaseDir: URL
    var db: UpdatesDatabase

    init() throws {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("SetExtraClientParamsTests")

      try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

      if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
        try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
      }

      db = UpdatesDatabase()
      db.databaseQueue.sync {
        try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
      }
    }

    @Test
    func `functions`() throws {
      db.databaseQueue.sync {
        let beforeSave = try! db.extraParams(withScopeKey: "test")
        #expect(beforeSave == nil)

        try! db.setExtraParam(key: "wat", value: "hello", withScopeKey: "test")

        let afterSave = try! db.extraParams(withScopeKey: "test")
        #expect(NSDictionary(dictionary: afterSave!).isEqual(to: ["wat": "hello"]) == true)

        try! db.setExtraParam(key: "wat", value: nil, withScopeKey: "test")

        let afterRemove = try! db.extraParams(withScopeKey: "test")
        #expect(NSDictionary(dictionary: afterRemove!).isEqual(to: [:]) == true)
      }
    }

    @Test
    func `validates`() {
      db.databaseQueue.sync {
        do {
          try db.setExtraParam(key: "Hello", value: "World", withScopeKey: "test")
          Issue.record("Expected to throw SerializerError")
        } catch let error as SerializerError {
          if case SerializerError.invalidCharacterInKey(let key, let character) = error {
            #expect(key == "Hello")
            #expect(character == "H")
          } else {
            Issue.record("Expected invalidCharacterInKey error")
          }
        } catch {
          Issue.record("Expected SerializerError but got \(error)")
        }
      }
    }
  }

  // MARK: - setMetadata

  @Suite("setMetadata", .serialized)
  struct SetMetadataTests {
    var testDatabaseDir: URL
    var db: UpdatesDatabase

    init() throws {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("SetMetadataTests")

      try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

      if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
        try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
      }

      db = UpdatesDatabase()
      db.databaseQueue.sync {
        try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
      }
    }

    @Test
    func `overwrites all fields`() throws {
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
        #expect(NSDictionary(dictionary: actual!).isEqual(to: expected) == true)
      }
    }

    @Test
    func `overwrites with empty`() throws {
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
        let expected: [String: String] = [:]
        let actual = try! db.manifestFilters(withScopeKey: "test")
        #expect(NSDictionary(dictionary: actual!).isEqual(to: expected) == true)
      }
    }

    @Test
    func `does not overwrite with nil`() throws {
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
        #expect(NSDictionary(dictionary: actual!).isEqual(to: expected) == true)
      }
    }
  }

  // MARK: - delete unused assets

  @Suite("delete unused assets", .serialized)
  struct DeleteUnusedAssetsTests {
    var testDatabaseDir: URL
    var db: UpdatesDatabase
    var config: UpdatesConfig

    init() throws {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("DeleteUnusedAssetsTests")

      try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

      if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
        try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
      }

      db = UpdatesDatabase()

      config = try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ])

      db.databaseQueue.sync {
        try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
      }
    }

    @Test
    func `works for duplicate filenames`() throws {
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
        try! db.addUpdate(update1, config: config)
        try! db.addUpdate(update2, config: config)
        try! db.addNewAssets([asset1, asset2], toUpdateWithId: update1.updateId)
        try! db.addNewAssets([asset3], toUpdateWithId: update2.updateId)

        #expect(try! db.allAssets().count == 3) // two bundles and asset1 and asset2

        // simulate update1 being reaped, update2 being kept
        try! db.deleteUpdates([update1])

        #expect(try! db.allAssets().count == 3) // two bundles and asset1 and asset2 (not reaped yet)

        let deletedAssets = try! db.deleteUnusedAssets()

        // asset1 should have been deleted, but asset2 should have been kept
        // since it shared a filename with asset3, which is still in use
        #expect(deletedAssets.count == 1)
        #expect(deletedAssets.allSatisfy({ asset in
          asset.key == "key1"
        }) == true)

        #expect(try! db.asset(withKey: "key1") == nil)
        #expect(try! db.asset(withKey: "key2") != nil)
        #expect(try! db.asset(withKey: "key3") != nil)
      }
    }
  }

  // MARK: - encode/decode requestHeaders

  @Suite("encode/decode requestHeaders")
  struct EncodeDecodeRequestHeadersTests {
    @Test
    func `should encode to json string`() {
      let requestHeaders = [
        "key1": "value1",
        "key2": "value2"
      ]
      let jsonString = UpdatesDatabase.encodeRequestHeaders(requestHeaders)
      guard let data = jsonString?.data(using: .utf8),
        let dict = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: String] else {
        Issue.record("Failed to decode JSON")
        return
      }
      #expect(dict["key1"] == "value1")
      #expect(dict["key2"] == "value2")
    }

    @Test
    func `should encode empty headers`() {
      let jsonString = UpdatesDatabase.encodeRequestHeaders([:])
      #expect(jsonString == "{}")
    }

    @Test
    func `should decode to dictionary`() {
      let jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}"
      let requestHeaders = UpdatesDatabase.decodeRequestHeaders(jsonString)
      #expect(requestHeaders == ["key1": "value1", "key2": "value2"])
    }

    @Test
    func `should decode empty headers`() {
      let requestHeaders = UpdatesDatabase.decodeRequestHeaders("{}")
      #expect(requestHeaders == [:])
    }

    @Test
    func `should decode to nil from invalid input`() {
      let jsonString = "{\"key1\"}"
      let requestHeaders = UpdatesDatabase.decodeRequestHeaders(jsonString)
      #expect(requestHeaders == nil)
    }
  }
}
