//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing
import ExpoModulesCore

@testable import EXUpdates

import EXManifests

@Suite("ExpoUpdatesUpdate instantiation")
struct NewUpdateTests {
  let config = try! UpdatesConfig.config(fromDictionary: [
    UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
    UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
  ])
  let database = UpdatesDatabase()

  @Test
  func `all fields`() {
    let manifest = ExpoUpdatesManifest(
      rawManifestJSON: [
        "runtimeVersion": "1",
        "id": "0eef8214-4833-4089-9dff-b4138a14f196",
        "createdAt": "2020-11-11T00:17:54.797Z",
        "launchAsset": [
          "url": "https://url.to/bundle.js",
          "contentType": "application/javascript"
        ]
      ]
    )

    #expect(throws: Never.self) {
      _ = ExpoUpdatesUpdate.update(
        withExpoUpdatesManifest: manifest,
        extensions: [:],
        config: config,
        database: database
      )
    }
  }

  @Test
  func `relative asset urls`() {
    let manifest = ExpoUpdatesManifest(
      rawManifestJSON: [
        "runtimeVersion": "1",
        "id": "0eef8214-4833-4089-9dff-b4138a14f196",
        "createdAt": "2020-11-11T00:17:54.797Z",
        "launchAsset": [
          "key": "bundle",
          "url": "index.bundle?platform=ios",
          "contentType": "application/javascript"
        ],
        "assets": [
          [
            "key": "asset",
            "url": "assets/icon.png",
            "fileExtension": ".png"
          ]
        ]
      ]
    )

    let update = ExpoUpdatesUpdate.update(
      withExpoUpdatesManifest: manifest,
      extensions: [:],
      config: config,
      database: database
    )

    #expect(update.assets()?[0].url?.absoluteString == "https://u.expo.dev/index.bundle?platform=ios")
    #expect(update.assets()?[1].url?.absoluteString == "https://u.expo.dev/assets/icon.png")
    #expect(update.manifest.bundleUrl() == "https://u.expo.dev/index.bundle?platform=ios")
  }

  @Test
  func `throws no runtime version`() {
    let manifest = ExpoUpdatesManifest(
      rawManifestJSON: [
        "id": "0eef8214-4833-4089-9dff-b4138a14f196",
        "createdAt": "2020-11-11T00:17:54.797Z",
        "launchAsset": [
          "url": "https://url.to/bundle.js",
          "contentType": "application/javascript"
        ]
      ]
    )

    #expect(throws: (any Error).self) {
      try EXUtilities.catchException {
        _ = ExpoUpdatesUpdate.update(
          withExpoUpdatesManifest: manifest,
          extensions: [:],
          config: self.config,
          database: self.database
        )
      }
    }
  }

  @Test
  func `throws when no id`() {
    let manifest = ExpoUpdatesManifest(
      rawManifestJSON: [
        "runtimeVersion": "1",
        "createdAt": "2020-11-11T00:17:54.797Z",
        "launchAsset": [
          "url": "https://url.to/bundle.js",
          "contentType": "application/javascript"
        ]
      ]
    )

    #expect(throws: (any Error).self) {
      try EXUtilities.catchException {
        _ = ExpoUpdatesUpdate.update(
          withExpoUpdatesManifest: manifest,
          extensions: [:],
          config: self.config,
          database: self.database
        )
      }
    }
  }

  @Test
  func `throws no created at`() {
    let manifest = ExpoUpdatesManifest(
      rawManifestJSON: [
        "runtimeVersion": "1",
        "id": "0eef8214-4833-4089-9dff-b4138a14f196",
        "launchAsset": [
          "url": "https://url.to/bundle.js",
          "contentType": "application/javascript"
        ]
      ]
    )

    #expect(throws: (any Error).self) {
      try EXUtilities.catchException {
        _ = ExpoUpdatesUpdate.update(
          withExpoUpdatesManifest: manifest,
          extensions: [:],
          config: self.config,
          database: self.database
        )
      }
    }
  }

  @Test
  func `throws when no launch asset`() {
    let manifest = ExpoUpdatesManifest(
      rawManifestJSON: [
        "runtimeVersion": "1",
        "id": "0eef8214-4833-4089-9dff-b4138a14f196",
        "createdAt": "2020-11-11T00:17:54.797Z",
      ]
    )

    #expect(throws: (any Error).self) {
      try EXUtilities.catchException {
        _ = ExpoUpdatesUpdate.update(
          withExpoUpdatesManifest: manifest,
          extensions: [:],
          config: self.config,
          database: self.database
        )
      }
    }
  }
}
