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

  // MARK: - addNewAssets failure handling

  @Suite("addNewAssets failure handling", .serialized)
  struct AddNewAssetsFailureTests {
    var testDatabaseDir: URL
    var db: UpdatesDatabase
    var manifest: ExpoUpdatesManifest
    var config: UpdatesConfig

    init() throws {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("AddNewAssetsFailureTests")

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
    func `throws and rolls back when a statement fails`() throws {
      let update = ExpoUpdatesUpdate.update(
        withExpoUpdatesManifest: manifest,
        extensions: [:],
        config: config,
        database: db
      )

      let asset = UpdateAsset(key: "bundle-key", type: "js")
      asset.downloadTime = Date()
      asset.contentHash = "hash"
      asset.filename = "bundle.js"
      asset.isLaunchAsset = true

      db.databaseQueue.sync {
        try! db.addUpdate(update, config: config)

        // force the per-asset join insert to fail
        _ = try! db.execute(sql: "DROP TABLE updates_assets", withArgs: nil)

        do {
          try db.addNewAssets([asset], toUpdateWithId: update.updateId)
          Issue.record("Expected addNewAssets to throw when a statement fails")
        } catch {}

        // the whole batch must have been rolled back
        #expect(try! db.asset(withKey: "bundle-key") == nil)
      }
    }

    @Test
    func `throws when a transaction is already open`() throws {
      let update = ExpoUpdatesUpdate.update(
        withExpoUpdatesManifest: manifest,
        extensions: [:],
        config: config,
        database: db
      )

      let asset = UpdateAsset(key: "bundle-key", type: "js")
      asset.downloadTime = Date()
      asset.contentHash = "hash"
      asset.filename = "bundle.js"
      asset.isLaunchAsset = true

      db.databaseQueue.sync {
        try! db.addUpdate(update, config: config)

        // an already-open transaction makes the internal BEGIN fail
        _ = try! db.execute(sql: "BEGIN;", withArgs: nil)
        defer { _ = try? db.execute(sql: "ROLLBACK;", withArgs: nil) }

        do {
          try db.addNewAssets([asset], toUpdateWithId: update.updateId)
          Issue.record("Expected addNewAssets to throw when its transaction cannot start")
        } catch UpdatesDatabaseError.transactionBeginError {
        } catch {
          Issue.record("Expected transactionBeginError but got \(error)")
        }
      }
    }
  }

  // MARK: - repair updates missing launch asset

  @Suite("repair updates missing launch asset", .serialized)
  struct RepairMissingLaunchAssetTests {
    var testDatabaseDir: URL
    var db: UpdatesDatabase
    var config: UpdatesConfig

    init() throws {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("RepairMissingLaunchAssetTests")

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

    private func makeUpdate(id: String) -> Update {
      let manifest = ExpoUpdatesManifest(rawManifestJSON: [
        "runtimeVersion": "1",
        "id": id,
        "createdAt": "2020-11-11T00:17:54.797Z",
        "launchAsset": ["url": "https://url.to/bundle.js", "contentType": "application/javascript"]
      ])
      return ExpoUpdatesUpdate.update(
        withExpoUpdatesManifest: manifest,
        extensions: [:],
        config: config,
        database: db
      )
    }

    @Test
    func `demotes ready updates without a launch asset during selection`() throws {
      let update = makeUpdate(id: "0eef8214-4833-4089-9dff-b4138a14f196")

      db.databaseQueue.sync {
        try! db.addUpdate(update, config: config)
        // simulate the broken end state: finished without any assets linked
        try! db.markUpdateFinished(update)

        let launchable = try! db.launchableUpdates(withConfig: config)
        #expect(launchable.isEmpty)

        let reloaded = try! db.update(withId: update.updateId, config: config)
        #expect(reloaded?.status == .StatusPending)
      }
    }

    @Test
    func `returns ready updates with a launch asset untouched`() throws {
      let update = makeUpdate(id: "0eef8214-4833-4089-9dff-b4138a14f197")

      let launchAsset = UpdateAsset(key: "bundle-key", type: "js")
      launchAsset.downloadTime = Date()
      launchAsset.contentHash = "hash"
      launchAsset.filename = "bundle.js"
      launchAsset.isLaunchAsset = true

      db.databaseQueue.sync {
        try! db.addUpdate(update, config: config)
        try! db.addNewAssets([launchAsset], toUpdateWithId: update.updateId)
        try! db.markUpdateFinished(update)

        let launchable = try! db.launchableUpdates(withConfig: config)
        #expect(launchable.map(\.updateId) == [update.updateId])

        let reloaded = try! db.update(withId: update.updateId, config: config)
        #expect(reloaded?.status == .StatusReady)
      }
    }
  }

  // MARK: - finishUpdateRegistration

  @Suite("finishUpdateRegistration", .serialized)
  struct FinishUpdateRegistrationTests {
    var testDatabaseDir: URL
    var db: UpdatesDatabase
    var config: UpdatesConfig

    init() throws {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("FinishUpdateRegistrationTests")

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

    private func makeUpdate(id: String, createdAt: String) -> Update {
      let manifest = ExpoUpdatesManifest(rawManifestJSON: [
        "runtimeVersion": "1",
        "id": id,
        "createdAt": createdAt,
        "launchAsset": ["url": "https://url.to/bundle.js", "contentType": "application/javascript"]
      ])
      return ExpoUpdatesUpdate.update(
        withExpoUpdatesManifest: manifest,
        extensions: [:],
        config: config,
        database: db
      )
    }

    private func makeAsset(key: String, isLaunchAsset: Bool = false) -> UpdateAsset {
      let asset = UpdateAsset(key: key, type: "js")
      asset.downloadTime = Date()
      asset.contentHash = key
      asset.filename = "\(key).js"
      asset.isLaunchAsset = isLaunchAsset
      return asset
    }

    private func joinRowCount(forUpdateId updateId: UUID) -> Int {
      db.databaseQueue.sync {
        try! db.execute(sql: "SELECT asset_id FROM updates_assets WHERE update_id = ?1;", withArgs: [updateId]).count
      }
    }

    @Test
    func `registers assets and marks the update finished`() throws {
      let update1 = makeUpdate(id: "0eef8214-4833-4089-9dff-b4138a14f196", createdAt: "2020-11-11T00:17:54.797Z")
      let update2 = makeUpdate(id: "0eef8214-4833-4089-9dff-b4138a14f197", createdAt: "2020-11-11T00:17:55.797Z")

      db.databaseQueue.sync {
        try! db.addUpdate(update1, config: config)
        try! db.addNewAssets([makeAsset(key: "asset-a")], toUpdateWithId: update1.updateId)

        try! db.addUpdate(update2, config: config)
        try! db.finishUpdateRegistration(
          update2,
          newAssets: [makeAsset(key: "asset-b", isLaunchAsset: true)],
          existingAssets: [makeAsset(key: "asset-a")],
          markFinished: true
        )
      }

      db.databaseQueue.sync {
        let reloaded = try! db.update(withId: update2.updateId, config: config)
        #expect(reloaded?.status == .StatusReady)
      }
      #expect(joinRowCount(forUpdateId: update2.updateId) == 2)
    }

    @Test
    func `persists nothing when any statement fails`() throws {
      let update1 = makeUpdate(id: "0eef8214-4833-4089-9dff-b4138a14f198", createdAt: "2020-11-11T00:17:56.797Z")
      let update2 = makeUpdate(id: "0eef8214-4833-4089-9dff-b4138a14f199", createdAt: "2020-11-11T00:17:57.797Z")

      db.databaseQueue.sync {
        try! db.addUpdate(update1, config: config)
        try! db.addNewAssets([makeAsset(key: "asset-a")], toUpdateWithId: update1.updateId)

        try! db.addUpdate(update2, config: config)

        // fail the insert of the new asset, after the existing asset was linked
        _ = try! db.execute(
          sql: """
            CREATE TRIGGER fail_asset_b BEFORE INSERT ON assets WHEN NEW."key" = 'asset-b'
            BEGIN SELECT RAISE(ABORT, 'injected failure'); END;
          """,
          withArgs: nil
        )

        do {
          try db.finishUpdateRegistration(
            update2,
            newAssets: [makeAsset(key: "asset-b", isLaunchAsset: true)],
            existingAssets: [makeAsset(key: "asset-a")],
            markFinished: true
          )
          Issue.record("Expected finishUpdateRegistration to throw when a statement fails")
        } catch let error as UpdatesDatabaseUtilsError {
          #expect(error.info?.message.contains("injected failure") == true)
        } catch {
          Issue.record("Expected the injected statement failure but got \(error)")
        }
      }

      db.databaseQueue.sync {
        let reloaded = try! db.update(withId: update2.updateId, config: config)
        #expect(reloaded?.status == .StatusPending)
      }
      #expect(joinRowCount(forUpdateId: update2.updateId) == 0)
    }

    @Test
    func `throws when marking finished without a launch asset`() throws {
      let update = makeUpdate(id: "0eef8214-4833-4089-9dff-b4138a14f19a", createdAt: "2020-11-11T00:17:58.797Z")

      db.databaseQueue.sync {
        try! db.addUpdate(update, config: config)

        do {
          try db.finishUpdateRegistration(
            update,
            newAssets: [makeAsset(key: "image-a")],
            existingAssets: [],
            markFinished: true
          )
          Issue.record("Expected finishUpdateRegistration to throw when no launch asset was linked")
        } catch UpdatesDatabaseError.finishedUpdateMissingLaunchAsset {
        } catch {
          Issue.record("Expected finishedUpdateMissingLaunchAsset but got \(error)")
        }
      }

      db.databaseQueue.sync {
        let reloaded = try! db.update(withId: update.updateId, config: config)
        #expect(reloaded?.status == .StatusPending)
      }
      #expect(joinRowCount(forUpdateId: update.updateId) == 0)
    }
  }

  @Suite("asset key conflicts", .serialized)
  struct AssetKeyConflictTests {
    var testDatabaseDir: URL
    var db: UpdatesDatabase
    var config: UpdatesConfig

    init() throws {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("AssetKeyConflictTests")

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

    private func makeUpdate(id: String, createdAt: String) -> Update {
      let manifest = ExpoUpdatesManifest(rawManifestJSON: [
        "runtimeVersion": "1",
        "id": id,
        "createdAt": createdAt,
        "launchAsset": ["url": "https://url.to/bundle.js", "contentType": "application/javascript"]
      ])
      return ExpoUpdatesUpdate.update(
        withExpoUpdatesManifest: manifest,
        extensions: [:],
        config: config,
        database: db
      )
    }

    private func makeAsset(key: String, isLaunchAsset: Bool = false) -> UpdateAsset {
      let asset = UpdateAsset(key: key, type: "js")
      asset.downloadTime = Date()
      asset.contentHash = key
      asset.filename = "\(key).js"
      asset.isLaunchAsset = isLaunchAsset
      return asset
    }

    private func joinRowCount(forUpdateId updateId: UUID) -> Int {
      db.databaseQueue.sync {
        try! db.execute(sql: "SELECT asset_id FROM updates_assets WHERE update_id = ?1;", withArgs: [updateId]).count
      }
    }

    private func assetRowCount(forKey key: String) -> Int {
      db.databaseQueue.sync {
        try! db.execute(sql: "SELECT id FROM assets WHERE \"key\" = ?1;", withArgs: [key]).count
      }
    }

    private func assetId(forKey key: String) -> NSNumber? {
      db.databaseQueue.sync {
        let rows = try! db.execute(sql: "SELECT id FROM assets WHERE \"key\" = ?1;", withArgs: [key])
        guard let row = rows.first else {
          return nil
        }
        let id: NSNumber = row.requiredValue(forKey: "id")
        return id
      }
    }

    private func launchAssetId(forUpdateId updateId: UUID) -> NSNumber? {
      db.databaseQueue.sync {
        let rows = try! db.execute(sql: "SELECT launch_asset_id FROM updates WHERE id = ?1;", withArgs: [updateId])
        guard let row = rows.first else {
          return nil
        }
        let launchAssetId: NSNumber? = row.optionalValue(forKey: "launch_asset_id")
        return launchAssetId
      }
    }

    @Test
    func `adopts the existing asset row instead of cascade-deleting its update`() throws {
      let update1 = makeUpdate(id: "0eef8214-4833-4089-9dff-b4138a14f1a0", createdAt: "2020-11-11T00:18:00.797Z")
      let update2 = makeUpdate(id: "0eef8214-4833-4089-9dff-b4138a14f1a1", createdAt: "2020-11-11T00:18:01.797Z")

      db.databaseQueue.sync {
        try! db.addUpdate(update1, config: config)
        try! db.finishUpdateRegistration(
          update1,
          newAssets: [makeAsset(key: "shared-bundle", isLaunchAsset: true)],
          existingAssets: [],
          markFinished: true
        )

        // a second update registers the same key as a new asset, as happens when
        // two loaders classify it before either has inserted it
        try! db.addUpdate(update2, config: config)
        try! db.addNewAssets([makeAsset(key: "shared-bundle", isLaunchAsset: true)], toUpdateWithId: update2.updateId)
      }

      db.databaseQueue.sync {
        let survivor = try! db.update(withId: update1.updateId, config: config)
        #expect(survivor != nil)
        #expect(survivor?.status == .StatusReady)
      }
      #expect(assetRowCount(forKey: "shared-bundle") == 1)
      #expect(joinRowCount(forUpdateId: update1.updateId) == 1)
      #expect(joinRowCount(forUpdateId: update2.updateId) == 1)

      // both updates must launch from the one surviving asset row
      let sharedAssetId = assetId(forKey: "shared-bundle")
      #expect(sharedAssetId != nil)
      #expect(launchAssetId(forUpdateId: update1.updateId) == sharedAssetId)
      #expect(launchAssetId(forUpdateId: update2.updateId) == sharedAssetId)
    }

    @Test
    func `keeps other updates linked to the conflicting asset`() throws {
      let update1 = makeUpdate(id: "0eef8214-4833-4089-9dff-b4138a14f1a2", createdAt: "2020-11-11T00:18:02.797Z")
      let update2 = makeUpdate(id: "0eef8214-4833-4089-9dff-b4138a14f1a3", createdAt: "2020-11-11T00:18:03.797Z")

      db.databaseQueue.sync {
        try! db.addUpdate(update1, config: config)
        try! db.finishUpdateRegistration(
          update1,
          newAssets: [makeAsset(key: "bundle-1", isLaunchAsset: true), makeAsset(key: "shared-image")],
          existingAssets: [],
          markFinished: true
        )

        try! db.addUpdate(update2, config: config)
        try! db.addNewAssets([makeAsset(key: "shared-image")], toUpdateWithId: update2.updateId)
      }

      // update1 must keep both of its asset links and its launch asset
      #expect(joinRowCount(forUpdateId: update1.updateId) == 2)
      #expect(assetRowCount(forKey: "shared-image") == 1)
      #expect(joinRowCount(forUpdateId: update2.updateId) == 1)
      #expect(launchAssetId(forUpdateId: update1.updateId) == assetId(forKey: "bundle-1"))

      // adopting a non-launch asset must not set the new update's launch asset
      #expect(launchAssetId(forUpdateId: update2.updateId) == nil)
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
