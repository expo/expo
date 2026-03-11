//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

@Suite("UpdatesBuildData", .serialized)
class UpdatesBuildDataTests {
  let scopeKey = "test"

  var testDatabaseDir: URL
  var db: UpdatesDatabase
  var logger: UpdatesLogger
  var manifest: ExpoUpdatesManifest
  var configChannelTestDictionary: [String: Any]
  var configChannelTest: UpdatesConfig
  var configChannelTestTwoDictionary: [String: Any]
  var configChannelTestTwo: UpdatesConfig

  init() throws {
    let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
    testDatabaseDir = applicationSupportDir!.appendingPathComponent("UpdatesBuildDataTests")

    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

    if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
      try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
    }

    db = UpdatesDatabase()

    logger = UpdatesLogger()

    manifest = ExpoUpdatesManifest(rawManifestJSON: [
      "runtimeVersion": "1",
      "id": "0eef8214-4833-4089-9dff-b4138a14f196",
      "createdAt": "2020-11-11T00:17:54.797Z",
      "launchAsset": ["url": "https://url.to/bundle.js", "contentType": "application/javascript"]
    ])

    configChannelTestDictionary = [
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRequestHeadersKey: ["expo-channel-name": "test"],
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ]
    configChannelTest = try UpdatesConfig.config(fromDictionary: configChannelTestDictionary)

    configChannelTestTwoDictionary = [
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRequestHeadersKey: ["expo-channel-name": "testTwo"],
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ]
    configChannelTestTwo = try UpdatesConfig.config(fromDictionary: configChannelTestTwoDictionary)

    // start every test with an update
    db.databaseQueue.sync {
      try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
      let update = ExpoUpdatesUpdate.update(
        withExpoUpdatesManifest: manifest,
        extensions: [:],
        config: configChannelTest,
        database: db
      )
      try! db.addUpdate(update, config: configChannelTest)
    }
  }

  deinit {
    db.databaseQueue.sync {
      db.closeDatabase()
    }
    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
  }

  // MARK: - clearAllUpdatesFromDatabase

  @Test
  func `clears updates`() throws {
    db.databaseQueue.sync {
      #expect(try! db.allUpdates(withConfig: configChannelTest).count > 0)
    }

    db.databaseQueue.async {
      UpdatesBuildData.clearAllUpdatesAndSetStaticBuildData(database: self.db, config: self.configChannelTest, logger: self.logger, scopeKey: self.scopeKey)
    }

    db.databaseQueue.sync {
      #expect(try! db.allUpdates(withConfig: configChannelTest).count == 0)
    }
  }

  // MARK: - build data consistency

  @Test
  func `no updates are cleared and build data is set when build data is null`() throws {
    db.databaseQueue.sync {
      #expect(try! db.staticBuildData(withScopeKey: scopeKey) == nil)
      #expect(try! db.allUpdates(withConfig: configChannelTest).count == 1)
    }

    UpdatesBuildData.ensureBuildDataIsConsistentAsync(database: db, config: configChannelTest, logger: logger)

    db.databaseQueue.sync {
      #expect(try! db.staticBuildData(withScopeKey: scopeKey) != nil)
      #expect(try! db.allUpdates(withConfig: configChannelTest).count == 1)
    }
  }

  @Test
  func `no updates are cleared and build data is not set when build data is consistent with channel`() throws {
    db.databaseQueue.sync {
      #expect(try! db.allUpdates(withConfig: configChannelTest).count == 1)
      try! db.setStaticBuildData(UpdatesBuildData.getBuildDataFromConfig(configChannelTest), withScopeKey: configChannelTest.scopeKey)
    }

    UpdatesBuildData.ensureBuildDataIsConsistentAsync(database: db, config: configChannelTest, logger: logger)

    db.databaseQueue.sync {
      let staticBuildData = try! db.staticBuildData(withScopeKey: scopeKey)
      #expect(
        NSDictionary(dictionary: staticBuildData!).isEqual(to: UpdatesBuildData.getBuildDataFromConfig(configChannelTest)) == true
      )
      #expect(try! db.allUpdates(withConfig: configChannelTest).count == 1)
    }
  }

  @Test
  func `updates are cleared and build data is set when build data is inconsistent with channel`() throws {
    db.databaseQueue.sync {
      #expect(try! db.allUpdates(withConfig: configChannelTest).count == 1)
      try! db.setStaticBuildData(UpdatesBuildData.getBuildDataFromConfig(configChannelTest), withScopeKey: configChannelTest.scopeKey)
    }

    UpdatesBuildData.ensureBuildDataIsConsistentAsync(database: db, config: configChannelTestTwo, logger: logger)

    db.databaseQueue.sync {
      let staticBuildData = try! db.staticBuildData(withScopeKey: scopeKey)
      #expect(
        NSDictionary(dictionary: staticBuildData!).isEqual(to: UpdatesBuildData.getBuildDataFromConfig(configChannelTestTwo)) == true
      )
      #expect(try! db.allUpdates(withConfig: configChannelTestTwo).count == 0)
    }
  }

  @Test
  func `updates are cleared and build data is set when override updateUrl`() throws {
    db.databaseQueue.sync {
      #expect(try! db.allUpdates(withConfig: configChannelTest).count == 1)
      try! db.setStaticBuildData(UpdatesBuildData.getBuildDataFromConfig(configChannelTest), withScopeKey: configChannelTest.scopeKey)
    }

    // Even the updateUrl and requestHeaders not changing here,
    // using configOverride would disable embedded update and having inconsistent build data.
    let configOverride = UpdatesConfigOverride(
      updateUrl: configChannelTest.updateUrl,
      requestHeaders: configChannelTest.requestHeaders
    )
    let configWithDisableAntiBrickingMeasures = configChannelTestDictionary.merging([UpdatesConfig.EXUpdatesConfigDisableAntiBrickingMeasures: true]) { current, _ in current }
    let configWithOverride = try UpdatesConfig.config(
      fromDictionary: configWithDisableAntiBrickingMeasures,
      configOverride: configOverride)
    UpdatesBuildData.ensureBuildDataIsConsistentAsync(database: db, config: configWithOverride, logger: logger)

    db.databaseQueue.sync {
      let staticBuildData = try! db.staticBuildData(withScopeKey: scopeKey)
      #expect(
        NSDictionary(dictionary: staticBuildData!).isEqual(to: UpdatesBuildData.getBuildDataFromConfig(configWithOverride)) == true
      )
      #expect(try! db.allUpdates(withConfig: configWithOverride).count == 0)
    }
  }

  @Test
  func `updates are cleared and build data is set when override hasEmbeddedUpdate`() throws {
    db.databaseQueue.sync {
      #expect(try! db.allUpdates(withConfig: configChannelTest).count == 1)
      try! db.setStaticBuildData(UpdatesBuildData.getBuildDataFromConfig(configChannelTest), withScopeKey: configChannelTest.scopeKey)
    }

    let configOverride = UpdatesConfigOverride(
      updateUrl: URL(string: "https://example.com"),
      requestHeaders: ["expo-channel-name": "fromOverride"]
    )
    let configWithDisableAntiBrickingMeasures = configChannelTestDictionary.merging([UpdatesConfig.EXUpdatesConfigDisableAntiBrickingMeasures: true]) { current, _ in current }
    let configWithOverride = try UpdatesConfig.config(
      fromDictionary: configWithDisableAntiBrickingMeasures,
      configOverride: configOverride)
    UpdatesBuildData.ensureBuildDataIsConsistentAsync(database: db, config: configWithOverride, logger: logger)

    db.databaseQueue.sync {
      let staticBuildData = try! db.staticBuildData(withScopeKey: scopeKey)
      #expect(
        NSDictionary(dictionary: staticBuildData!).isEqual(to: UpdatesBuildData.getBuildDataFromConfig(configWithOverride)) == true
      )
      #expect(try! db.allUpdates(withConfig: configWithOverride).count == 0)
    }
  }

  // MARK: - isBuildDataConsistent

  @Test
  func `should return true for same data`() {
    let sourceBuildData: [String: Any] = [
      "EXUpdatesURL": "https://example.com",
      "EXUpdatesRequestHeaders": ["expo-channel-name": "default"],
    ]
    let targetBuildData: [String: Any] = [
      "EXUpdatesURL": "https://example.com",
      "EXUpdatesRequestHeaders": ["expo-channel-name": "default"],
    ]
    #expect(UpdatesBuildData.isBuildDataConsistent(sourceBuildData, targetBuildData) == true)
  }

  @Test
  func `should return false for EXUpdatesRequestHeaders change`() {
    let sourceBuildData: [String: Any] = [
      "EXUpdatesURL": "https://example.com",
      "EXUpdatesRequestHeaders": ["expo-channel-name": "default"],
    ]
    let targetBuildData: [String: Any] = [
      "EXUpdatesURL": "https://example.com",
      "EXUpdatesRequestHeaders": ["expo-channel-name": "preview"],
    ]
    #expect(UpdatesBuildData.isBuildDataConsistent(sourceBuildData, targetBuildData) == false)
  }

  @Test
  func `should support migration with new EXUpdatesHasEmbeddedUpdate key`() {
    let sourceBuildData: [String: Any] = [
      "EXUpdatesURL": "https://example.com",
      "EXUpdatesRequestHeaders": ["expo-channel-name": "default"],
    ]
    let targetBuildData: [String: Any] = [
      "EXUpdatesURL": "https://example.com",
      "EXUpdatesRequestHeaders": ["expo-channel-name": "default"],
      "EXUpdatesHasEmbeddedUpdate": true
    ]
    #expect(UpdatesBuildData.isBuildDataConsistent(sourceBuildData, targetBuildData) == true)
  }

  @Test
  func `should not overwrite existing data from the default build data`() {
    let sourceBuildData: [String: Any] = [
      "EXUpdatesURL": "https://example.com",
      "EXUpdatesHasEmbeddedUpdate": false
    ]
    let targetBuildData: [String: Any] = [
      "EXUpdatesURL": "https://example.com",
      "EXUpdatesHasEmbeddedUpdate": false
    ]
    #expect(UpdatesBuildData.isBuildDataConsistent(sourceBuildData, targetBuildData) == true)
  }
}
