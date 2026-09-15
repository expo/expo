//  Copyright (c) 2026 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

/// Records network fetches, and satisfies them so the load still completes.
class RecordingAppLoader: AppLoader {
  private let lock = NSLock()
  private var downloadedKeysStorage: [String] = []

  var downloadedKeys: [String] {
    lock.lock()
    defer { lock.unlock() }
    return downloadedKeysStorage
  }

  override func downloadAsset(_ asset: UpdateAsset, extraHeaders: [String: Any]) {
    lock.lock()
    downloadedKeysStorage.append(asset.key ?? "")
    lock.unlock()

    DispatchQueue.global().async {
      self.handleAssetDownload(withData: Data("downloaded".utf8), response: nil, asset: asset)
    }
  }
}

// Only used to locate the test bundle that holds the fixtures.
class AppLoaderEmbeddedAssetTestsForBundle {}

@Suite("AppLoader embedded asset reuse", .serialized)
@MainActor
class AppLoaderEmbeddedAssetTests {
  var testDatabaseDir: URL
  var db: UpdatesDatabase

  init() throws {
    let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
    testDatabaseDir = applicationSupportDir!.appendingPathComponent("AppLoaderEmbeddedAssetTests")

    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

    if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
      try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
    }

    db = UpdatesDatabase()
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

  @Test
  func `a remote asset already in the app binary is copied instead of downloaded`() async throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "dummyScope",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])

    // No database row and no file on disk, which is the state a remote update meets.
    let embeddedUpdate = Update.update(
      withRawEmbeddedManifest: [
        "id": "0eef8214-4833-4089-9dff-b4138a14f196",
        "commitTime": 1609975977832,
        "assets": [
          ["packagerHash": "shared-asset", "type": "png", "nsBundleFilename": "embedded-image"]
        ],
      ],
      config: config,
      database: db
    )

    let remoteUpdate = ExpoUpdatesUpdate.update(
      withExpoUpdatesManifest: ExpoUpdatesManifest(rawManifestJSON: [
        "runtimeVersion": "1",
        "id": "8b3c2e10-4f5a-4a1e-9c77-2b0f1d6a4e21",
        "createdAt": "2026-01-02T00:17:54.797Z",
        "launchAsset": [
          "key": "remote-bundle",
          "url": "https://example.com/index.bundle",
          "contentType": "application/javascript",
        ],
        "assets": [
          [
            "key": "shared-asset",
            "url": "https://example.com/shared.png",
            "fileExtension": ".png",
            "hash": "iG7KKTcT3Q3HfujEksZOgTWfbgKGt51fbfIMUGRm0eI",
          ],
          ["key": "remote-only", "url": "https://example.com/other.png", "fileExtension": ".png"],
        ],
      ]),
      extensions: [:],
      config: config,
      database: db
    )

    let loader = RecordingAppLoader(
      config: config,
      logger: UpdatesLogger(),
      database: db,
      directory: testDatabaseDir,
      launchedUpdate: nil,
      completionQueue: DispatchQueue.global(qos: .default)
    )
    // Assigned before any read, so the lazy initializer that reads `app.manifest` never runs.
    loader.embeddedUpdate = embeddedUpdate
    loader.embeddedAssetsBundle = Bundle(for: AppLoaderEmbeddedAssetTestsForBundle.self)

    let success: Bool = await withCheckedContinuation { continuation in
      loader.updateResponseBlock = { _ in true }
      loader.assetBlock = { _, _, _, _ in }
      loader.successBlock = { _ in continuation.resume(returning: true) }
      loader.errorBlock = { _ in continuation.resume(returning: false) }
      loader.startLoading(fromUpdateResponse: UpdateResponse(
        responseHeaderData: nil,
        manifestUpdateResponsePart: ManifestUpdateResponsePart(updateManifest: remoteUpdate),
        directiveUpdateResponsePart: nil
      ))
    }

    #expect(success == true)

    let downloadedKeys = loader.downloadedKeys
    #expect(!downloadedKeys.contains("shared-asset"))
    #expect(downloadedKeys.contains("remote-only"))
    #expect(downloadedKeys.contains("remote-bundle"))

    let copiedUrl = testDatabaseDir.appendingPathComponent("shared-asset.png")
    #expect(FileManager.default.fileExists(atPath: copiedUrl.path))

    let fixturePath = Bundle(for: AppLoaderEmbeddedAssetTestsForBundle.self)
      .path(forResource: "embedded-image", ofType: "png")
    #expect(fixturePath != nil, "embedded-image.png is missing from the test bundle")
    if let fixturePath = fixturePath {
      // read optionally so a missing copy fails the expectation instead of throwing out
      let copiedData = try? Data(contentsOf: copiedUrl)
      let fixtureData = try? Data(contentsOf: URL(fileURLWithPath: fixturePath))
      #expect(copiedData == fixtureData)
    }

    // Registered, so a later update reuses it from the cache.
    db.databaseQueue.sync {
      let storedAsset = try? db.asset(withKey: "shared-asset")
      #expect(storedAsset != nil)
    }
  }

  @Test
  func `an embedded asset whose manifest file extension escapes the directory is not copied`() async throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "dummyScope",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])

    let embeddedUpdate = Update.update(
      withRawEmbeddedManifest: [
        "id": "0eef8214-4833-4089-9dff-b4138a14f196",
        "commitTime": 1609975977832,
        "assets": [
          ["packagerHash": "escaping-asset", "type": "png", "nsBundleFilename": "embedded-image"]
        ],
      ],
      config: config,
      database: db
    )

    // The key matches the binary, but the manifest's file extension walks out of the directory.
    let remoteUpdate = ExpoUpdatesUpdate.update(
      withExpoUpdatesManifest: ExpoUpdatesManifest(rawManifestJSON: [
        "runtimeVersion": "1",
        "id": "8b3c2e10-4f5a-4a1e-9c77-2b0f1d6a4e21",
        "createdAt": "2026-01-02T00:17:54.797Z",
        "launchAsset": [
          "key": "remote-bundle",
          "url": "https://example.com/index.bundle",
          "contentType": "application/javascript",
        ],
        "assets": [
          ["key": "escaping-asset", "url": "https://example.com/escape.png", "fileExtension": "/../../evil"]
        ],
      ]),
      extensions: [:],
      config: config,
      database: db
    )

    let loader = RecordingAppLoader(
      config: config,
      logger: UpdatesLogger(),
      database: db,
      directory: testDatabaseDir,
      launchedUpdate: nil,
      completionQueue: DispatchQueue.global(qos: .default)
    )
    loader.embeddedUpdate = embeddedUpdate
    loader.embeddedAssetsBundle = Bundle(for: AppLoaderEmbeddedAssetTestsForBundle.self)

    _ = await withCheckedContinuation { continuation in
      loader.updateResponseBlock = { _ in true }
      loader.assetBlock = { _, _, _, _ in }
      loader.successBlock = { _ in continuation.resume(returning: true) }
      loader.errorBlock = { _ in continuation.resume(returning: false) }
      loader.startLoading(fromUpdateResponse: UpdateResponse(
        responseHeaderData: nil,
        manifestUpdateResponsePart: ManifestUpdateResponsePart(updateManifest: remoteUpdate),
        directiveUpdateResponsePart: nil
      ))
    }

    // Handed to the downloader, whose own guard rejects the filename.
    #expect(loader.downloadedKeys.contains("escaping-asset"))

    // `escaping-asset/../../evil` resolves to a sibling of the updates directory.
    let escaped = testDatabaseDir.deletingLastPathComponent().appendingPathComponent("evil")
    #expect(!FileManager.default.fileExists(atPath: escaped.path))
  }

  @Test
  func `an embedded asset whose hash does not match the manifest is downloaded instead`() async throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "dummyScope",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])

    let embeddedUpdate = Update.update(
      withRawEmbeddedManifest: [
        "id": "0eef8214-4833-4089-9dff-b4138a14f196",
        "commitTime": 1609975977832,
        "assets": [
          ["packagerHash": "shared-asset", "type": "png", "nsBundleFilename": "embedded-image"]
        ],
      ],
      config: config,
      database: db
    )

    // The manifest expects different bytes than the binary ships, so the copy must be refused.
    let remoteUpdate = ExpoUpdatesUpdate.update(
      withExpoUpdatesManifest: ExpoUpdatesManifest(rawManifestJSON: [
        "runtimeVersion": "1",
        "id": "8b3c2e10-4f5a-4a1e-9c77-2b0f1d6a4e21",
        "createdAt": "2026-01-02T00:17:54.797Z",
        "launchAsset": [
          "key": "remote-bundle",
          "url": "https://example.com/index.bundle",
          "contentType": "application/javascript",
        ],
        "assets": [
          [
            "key": "shared-asset",
            "url": "https://example.com/shared.png",
            "fileExtension": ".png",
            "hash": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          ]
        ],
      ]),
      extensions: [:],
      config: config,
      database: db
    )

    let loader = RecordingAppLoader(
      config: config,
      logger: UpdatesLogger(),
      database: db,
      directory: testDatabaseDir,
      launchedUpdate: nil,
      completionQueue: DispatchQueue.global(qos: .default)
    )
    loader.embeddedUpdate = embeddedUpdate
    loader.embeddedAssetsBundle = Bundle(for: AppLoaderEmbeddedAssetTestsForBundle.self)

    let success: Bool = await withCheckedContinuation { continuation in
      loader.updateResponseBlock = { _ in true }
      loader.assetBlock = { _, _, _, _ in }
      loader.successBlock = { _ in continuation.resume(returning: true) }
      loader.errorBlock = { _ in continuation.resume(returning: false) }
      loader.startLoading(fromUpdateResponse: UpdateResponse(
        responseHeaderData: nil,
        manifestUpdateResponsePart: ManifestUpdateResponsePart(updateManifest: remoteUpdate),
        directiveUpdateResponsePart: nil
      ))
    }

    #expect(success == true)
    #expect(loader.downloadedKeys.contains("shared-asset"))
    #expect(!FileManager.default.fileExists(atPath: testDatabaseDir.appendingPathComponent("shared-asset.png").path))
  }

  @Test
  func `the embedded loader leaves the copy to the launcher`() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "dummyScope",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])

    let embeddedAsset = UpdateAsset(key: "shared-asset", type: "png")
    embeddedAsset.mainBundleFilename = "embedded-image"

    let loader = EmbeddedAppLoader(
      config: config,
      logger: UpdatesLogger(),
      database: db,
      directory: testDatabaseDir,
      launchedUpdate: nil,
      completionQueue: DispatchQueue.global(qos: .default)
    )
    loader.embeddedAssetsBundle = Bundle(for: AppLoaderEmbeddedAssetTestsForBundle.self)

    // Inputs a remote load would copy from, so only the loader itself can refuse them.
    let handled = loader.copyAssetFromEmbeddedBundleIfPresent(
      UpdateAsset(key: "shared-asset", type: "png"),
      embeddedAssetsByKey: ["shared-asset": embeddedAsset]
    )

    #expect(handled == false)
    let copied = testDatabaseDir.appendingPathComponent("shared-asset.png")
    #expect(!FileManager.default.fileExists(atPath: copied.path))
  }
}
