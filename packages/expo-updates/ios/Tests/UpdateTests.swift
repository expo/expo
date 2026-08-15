//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

@Suite("Update instantiation")
struct UpdateTests {
  let config = try! UpdatesConfig.config(fromDictionary: [
    UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000"
  ])
  let database = UpdatesDatabase()

  @Test
  func `throws for legacy manifest`() {
    let legacyManifest = [
      "sdkVersion": "39.0.0",
      "releaseId": "0eef8214-4833-4089-9dff-b4138a14f196",
      "commitTime": "2020-11-11T00:17:54.797Z",
      "bundleUrl": "https://url.to/bundle.js"
    ]

    let responseHeaderData = ResponseHeaderData(
      protocolVersionRaw: nil,
      serverDefinedHeadersRaw: nil,
      manifestFiltersRaw: nil
    )

    #expect(throws: (any Error).self) {
      try Update.update(
        withManifest: legacyManifest,
        responseHeaderData: responseHeaderData,
        extensions: [:],
        config: config,
        database: database
      )
    }
  }

  @Test
  func `works for expo updates manifest`() throws {
    let expoUpdatesManifest: [String: Any] = [
      "runtimeVersion": "1",
      "id": "0eef8214-4833-4089-9dff-b4138a14f196",
      "createdAt": "2020-11-11T00:17:54.797Z",
      "launchAsset": [
        "url": "https://url.to/bundle.js",
        "contentType": "application/javascript"
      ]
    ]

    let responseHeaderData = ResponseHeaderData(
      protocolVersionRaw: "0",
      serverDefinedHeadersRaw: nil,
      manifestFiltersRaw: nil
    )

    _ = try Update.update(
      withManifest: expoUpdatesManifest,
      responseHeaderData: responseHeaderData,
      extensions: [:],
      config: config,
      database: database
    )
  }

  @Test
  func `throws for unsupported protocol version`() {
    let expoUpdatesManifest: [String: Any] = [
      "runtimeVersion": "1",
      "id": "0eef8214-4833-4089-9dff-b4138a14f196",
      "createdAt": "2020-11-11T00:17:54.797Z",
      "launchAsset": [
        "url": "https://url.to/bundle.js",
        "contentType": "application/javascript"
      ]
    ]

    let responseHeaderData = ResponseHeaderData(
      protocolVersionRaw: "2",
      serverDefinedHeadersRaw: nil,
      manifestFiltersRaw: nil
    )

    #expect {
      try Update.update(
        withManifest: expoUpdatesManifest,
        responseHeaderData: responseHeaderData,
        extensions: [:],
        config: config,
        database: database
      )
    } throws: { error in
      guard case UpdateError.invalidExpoProtocolVersion(protocolVersion: 2) = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws for asset key that escapes the updates directory`() {
    #expect {
      try Update.update(
        withManifest: manifest(assetKey: "../../Library/Preferences/pwned", fileExtension: ".plist"),
        responseHeaderData: ResponseHeaderData(
          protocolVersionRaw: "0",
          serverDefinedHeadersRaw: nil,
          manifestFiltersRaw: nil
        ),
        extensions: [:],
        config: config,
        database: database
      )
    } throws: { error in
      guard case UpdateError.unsafeAssetFilename = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws for file extension that escapes the updates directory`() {
    #expect {
      try Update.update(
        withManifest: manifest(assetKey: "image", fileExtension: ".png/../../pwned"),
        responseHeaderData: ResponseHeaderData(
          protocolVersionRaw: "0",
          serverDefinedHeadersRaw: nil,
          manifestFiltersRaw: nil
        ),
        extensions: [:],
        config: config,
        database: database
      )
    } throws: { error in
      guard case UpdateError.unsafeAssetFilename = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `works for asset key with leading dots`() throws {
    // Only path separators and the `..` component are dangerous. A key may still start with a dot.
    let update = try Update.update(
      withManifest: manifest(assetKey: "..hidden", fileExtension: ".png"),
      responseHeaderData: ResponseHeaderData(
        protocolVersionRaw: "0",
        serverDefinedHeadersRaw: nil,
        manifestFiltersRaw: nil
      ),
      extensions: [:],
      config: config,
      database: database
    )
    #expect(update.assets()?.contains(where: { $0.filename == "..hidden.png" }) == true)
  }

  private func manifest(assetKey: String, fileExtension: String) -> [String: Any] {
    return [
      "runtimeVersion": "1",
      "id": "0eef8214-4833-4089-9dff-b4138a14f196",
      "createdAt": "2020-11-11T00:17:54.797Z",
      "launchAsset": [
        "key": "696a70cf7035664c20ea86f67dae822b",
        "url": "https://url.to/bundle.js",
        "contentType": "application/javascript"
      ],
      "assets": [
        [
          "key": assetKey,
          "url": "https://url.to/asset",
          "fileExtension": fileExtension
        ]
      ]
    ]
  }

  @Test
  func `works for embedded bare manifest`() {
    let embeddedManifest: [String: Any] = [
      "id": "0eef8214-4833-4089-9dff-b4138a14f196",
      "commitTime": 1609975977832
    ]
    _ = Update.update(
      withRawEmbeddedManifest: embeddedManifest,
      config: config,
      database: database
    )
  }
}
