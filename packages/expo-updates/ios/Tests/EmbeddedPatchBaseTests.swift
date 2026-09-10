//  Copyright (c) 2026 650 Industries, Inc. All rights reserved.

import Testing
import Foundation

@testable import EXUpdates

import EXManifests

class EmbeddedPatchBaseTestsBundle {}

/**
 Reproduces the embedded-bundle patch base failure.

 On a fresh install the launched update is the embedded update. `EX_UPDATES_COPY_EMBEDDED_ASSETS`
 is off by default, so `EmbeddedAppLoader` takes `registerEmbeddedUpdateWithoutCopying`, which
 writes the update row and no asset rows at all. `FileDownloader.resolveLaunchAsset` looks the
 patch base up in exactly those rows, finds nothing, and throws `.launchAssetNotFound`. The caller
 catches that and re-requests the full bundle, so the device pays for the patch and the bundle.

 The control test proves the same real bsdiff patch applies when the base bundle is on disk.
 */
@Suite("Embedded bundle as patch base", .serialized)
@MainActor
class EmbeddedPatchBaseTests {
  let testDatabaseDir: URL
  let updatesDir: URL
  let db: UpdatesDatabase
  let logger: UpdatesLogger
  let config: UpdatesConfig
  let downloader: FileDownloader

  let baseData: Data
  let expectedPatchedData: Data
  let patchData: Data
  let expectedPatchedHash: String

  init() throws {
    let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last!
    let testDatabaseDir = applicationSupportDir.appendingPathComponent("EmbeddedPatchBaseTests")
    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
    try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)

    let updatesDir = testDatabaseDir.appendingPathComponent("updates")
    try FileManager.default.createDirectory(at: updatesDir, withIntermediateDirectories: true)

    let logger = UpdatesLogger()
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/11111111-1111-1111-1111-111111111111",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0.0",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "test-scope",
      UpdatesConfig.EXUpdatesConfigEnableBsdiffPatchSupportKey: true
    ])

    let db = UpdatesDatabase()
    let bundle = Bundle(for: EmbeddedPatchBaseTestsBundle.self)
    let expectedPatchedData = try Data(contentsOf: URL(fileURLWithPath: bundle.path(forResource: "new", ofType: "hbc")!))

    self.testDatabaseDir = testDatabaseDir
    self.updatesDir = updatesDir
    self.logger = logger
    self.config = config
    self.db = db
    self.downloader = FileDownloader(
      config: config,
      logger: logger,
      updatesDirectory: updatesDir,
      database: db
    )
    self.baseData = try Data(contentsOf: URL(fileURLWithPath: bundle.path(forResource: "old", ofType: "hbc")!))
    self.expectedPatchedData = expectedPatchedData
    self.patchData = try Data(contentsOf: URL(fileURLWithPath: bundle.path(forResource: "test", ofType: "patch")!))
    self.expectedPatchedHash = UpdatesUtils.base64UrlEncodedSHA256WithData(expectedPatchedData)

    // Locals only: capturing `self` here would reference members before they are all initialized.
    db.databaseQueue.sync {
      try! db.openDatabase(inDirectory: testDatabaseDir, logger: logger)
    }
  }

  deinit {
    db.databaseQueue.sync {
      db.closeDatabase()
    }
    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
  }

  /// The embedded manifest that `createManifest.js` ships in the binary. It declares a launch
  /// asset, so the update genuinely has a bundle — it just lives in the app binary.
  private func makeEmbeddedUpdate() -> Update {
    return Update.update(
      withRawEmbeddedManifest: [
        "id": UUID().uuidString.lowercased(),
        "commitTime": 1_609_975_977_832,
        "isVerified": true
      ],
      config: config,
      database: db
    )
  }

  private func makeRequestedUpdate() -> Update {
    return Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: UUID(),
      scopeKey: config.scopeKey,
      commitTime: Date(),
      runtimeVersion: config.runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: config.updateUrl,
      requestHeaders: [:]
    )
  }

  /// Registers the embedded update exactly as production does when the copy flag is off.
  private func registerEmbeddedUpdateTheDefaultWay(_ embeddedUpdate: Update) async -> Bool {
    let loader = EmbeddedAppLoader(
      config: config,
      logger: logger,
      database: db,
      directory: updatesDir,
      launchedUpdate: nil,
      completionQueue: DispatchQueue.global(qos: .default)
    )
    loader.shouldCopyEmbeddedAssets = false

    return await withCheckedContinuation { continuation in
      loader.updateResponseBlock = { _ in true }
      loader.assetBlock = { _, _, _, _ in }
      loader.successBlock = { _ in continuation.resume(returning: true) }
      loader.errorBlock = { _ in continuation.resume(returning: false) }
      loader.startEmbeddedLoad(fromEmbeddedManifest: embeddedUpdate)
    }
  }

  /// Control. Once the device has taken one update over the air its bundle is in the updates
  /// directory, and the patch applies.
  @Test
  func `patch applies when the launched update bundle is in the updates directory`() throws {
    let launchedUpdate = makeRequestedUpdate()
    db.databaseQueue.sync {
      try! db.addUpdate(launchedUpdate, config: config)
    }

    let launchAsset = UpdateAsset(key: "launch-bundle", type: "hbc")
    launchAsset.isLaunchAsset = true
    launchAsset.filename = "launch-asset.hbc"
    launchAsset.downloadTime = Date()
    launchAsset.contentHash = UpdatesUtils.hexEncodedSHA256WithData(baseData)
    launchAsset.expectedHash = UpdatesUtils.base64UrlEncodedSHA256WithData(baseData)
    try baseData.write(to: updatesDir.appendingPathComponent(launchAsset.filename), options: .atomic)
    db.databaseQueue.sync {
      try! db.addNewAssets([launchAsset], toUpdateWithId: launchedUpdate.updateId)
    }

    let targetAsset = UpdateAsset(key: "new-bundle", type: "hbc")
    targetAsset.isLaunchAsset = true

    let (patchedData, patchedHash) = try downloader.applyHermesDiff(
      asset: targetAsset,
      diffData: patchData,
      destinationPath: updatesDir.appendingPathComponent("patched-control.hbc").path,
      launchedUpdate: launchedUpdate,
      requestedUpdate: makeRequestedUpdate(),
      expectedBase64URLEncodedSHA256Hash: expectedPatchedHash
    )

    #expect(patchedData == expectedPatchedData)
    #expect(patchedHash == expectedPatchedHash)
  }

  /// Empirical reconstruction of the pre-#47284 loader. Before that PR `EmbeddedAppLoader` had no
  /// `shouldCopyEmbeddedAssets` branch: `loadUpdateResponseFromEmbeddedManifest` always went through
  /// `startLoading`, which is the same path `shouldCopyEmbeddedAssets = true` takes today. This
  /// drives that real path and asserts what #47284 removed — asset rows for the embedded update —
  /// then patches against them.
  ///
  /// `AppLoader.finish()` reads an existing asset from `directory/<filename>` before falling back to
  /// the app binary, so pre-placing the bundle there stands in for the binary the unit-test host
  /// doesn't have. Every line of production code in between runs unmodified.
  @Test
  func `copy-enabled load registers the launch asset row and the patch then applies`() async throws {
    // hasEmbeddedUpdate=false keeps `startLoading` from reaching for an `app.manifest` the
    // unit-test host doesn't ship. Nothing else about the load path changes.
    let loaderConfig = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/11111111-1111-1111-1111-111111111111",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0.0",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "test-scope",
      UpdatesConfig.EXUpdatesConfigEnableBsdiffPatchSupportKey: true,
      UpdatesConfig.EXUpdatesConfigHasEmbeddedUpdateKey: false
    ])
    let embeddedUpdate = Update.update(
      withRawEmbeddedManifest: [
        "id": UUID().uuidString.lowercased(),
        "commitTime": 1_609_975_977_832,
        "isVerified": true
      ],
      config: loaderConfig,
      database: db
    )
    let embeddedLaunchAsset = try #require(embeddedUpdate.assets()?.first { $0.isLaunchAsset })
    try baseData.write(
      to: updatesDir.appendingPathComponent(embeddedLaunchAsset.filename),
      options: .atomic
    )

    let loader = EmbeddedAppLoader(
      config: loaderConfig,
      logger: logger,
      database: db,
      directory: updatesDir,
      launchedUpdate: nil,
      completionQueue: DispatchQueue.global(qos: .default)
    )
    loader.shouldCopyEmbeddedAssets = true // the only pre-#47284 behaviour

    let success: Bool = await withCheckedContinuation { continuation in
      loader.updateResponseBlock = { _ in true }
      loader.assetBlock = { _, _, _, _ in }
      loader.successBlock = { _ in continuation.resume(returning: true) }
      loader.errorBlock = { _ in continuation.resume(returning: false) }
      loader.startEmbeddedLoad(fromEmbeddedManifest: embeddedUpdate)
    }
    #expect(success == true)

    // This is exactly what #47284 stopped doing.
    var storedAssets: [UpdateAsset] = []
    db.databaseQueue.sync {
      storedAssets = (try? db.assets(withUpdateId: embeddedUpdate.updateId)) ?? []
    }
    #expect(storedAssets.isEmpty == false)
    #expect(storedAssets.contains { $0.isLaunchAsset } == true)

    // And with those rows present, the real patch applies against the embedded bundle.
    let targetAsset = UpdateAsset(key: "new-bundle", type: "hbc")
    targetAsset.isLaunchAsset = true

    let (patchedData, patchedHash) = try downloader.applyHermesDiff(
      asset: targetAsset,
      diffData: patchData,
      destinationPath: updatesDir.appendingPathComponent("patched-pre-47284.hbc").path,
      launchedUpdate: embeddedUpdate,
      requestedUpdate: makeRequestedUpdate(),
      expectedBase64URLEncodedSHA256Hash: expectedPatchedHash
    )

    #expect(patchedData == expectedPatchedData)
    #expect(patchedHash == expectedPatchedHash)
  }

  /// Repro. The launched update is the embedded update, registered the default way. Its bundle
  /// exists inside the app binary, but not in any asset row, which is the only place the patch
  /// base is looked up.
  @Test
  func `patch applies when the launched update is the embedded update`() async throws {
    let embeddedUpdate = makeEmbeddedUpdate()
    let registered = await registerEmbeddedUpdateTheDefaultWay(embeddedUpdate)
    #expect(registered == true)

    // The embedded update declares a launch asset...
    #expect(embeddedUpdate.assets()?.contains { $0.isLaunchAsset } == true)

    db.databaseQueue.sync {
      let storedUpdate = try! db.update(withId: embeddedUpdate.updateId, config: config)
      #expect(storedUpdate != nil)
      #expect(storedUpdate?.status == .StatusEmbedded)

      // ...but registration wrote no asset rows for it, so there is nothing for the patch base
      // lookup to find.
      let storedAssets = try! db.assets(withUpdateId: embeddedUpdate.updateId)
      #expect(storedAssets.isEmpty == true)
    }

    let targetAsset = UpdateAsset(key: "new-bundle", type: "hbc")
    targetAsset.isLaunchAsset = true

    let (patchedData, patchedHash) = try downloader.applyHermesDiff(
      asset: targetAsset,
      diffData: patchData,
      destinationPath: updatesDir.appendingPathComponent("patched-embedded.hbc").path,
      launchedUpdate: embeddedUpdate,
      requestedUpdate: makeRequestedUpdate(),
      expectedBase64URLEncodedSHA256Hash: expectedPatchedHash
    )

    #expect(patchedData == expectedPatchedData)
    #expect(patchedHash == expectedPatchedHash)
  }
}
