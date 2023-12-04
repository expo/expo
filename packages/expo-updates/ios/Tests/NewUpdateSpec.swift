//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class NewUpdateSpec : ExpoSpec {
  override class func spec() {
    let config = try! UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let database = UpdatesDatabase()

    describe("instantiation") {
      it("all fields") {
        let manifest = NewManifest(
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

        expect(NewUpdate.update(
          withNewManifest: manifest,
          extensions: [:],
          config: config,
          database: database
        )).notTo(beNil())
      }

      it("no runtime version") {
        let manifest = NewManifest(
          rawManifestJSON: [
            "id": "0eef8214-4833-4089-9dff-b4138a14f196",
            "createdAt": "2020-11-11T00:17:54.797Z",
            "launchAsset": [
              "url": "https://url.to/bundle.js",
              "contentType": "application/javascript"
            ]
          ]
        )

        expect(NewUpdate.update(
          withNewManifest: manifest,
          extensions: [:],
          config: config,
          database: database
        )).to(raiseException())
      }

      it("no id") {
        let manifest = NewManifest(
          rawManifestJSON: [
            "runtimeVersion": "1",
            "createdAt": "2020-11-11T00:17:54.797Z",
            "launchAsset": [
              "url": "https://url.to/bundle.js",
              "contentType": "application/javascript"
            ]
          ]
        )

        expect(NewUpdate.update(
          withNewManifest: manifest,
          extensions: [:],
          config: config,
          database: database
        )).to(raiseException())
      }

      it("no created at") {
        let manifest = NewManifest(
          rawManifestJSON: [
            "runtimeVersion": "1",
            "id": "0eef8214-4833-4089-9dff-b4138a14f196",
            "launchAsset": [
              "url": "https://url.to/bundle.js",
              "contentType": "application/javascript"
            ]
          ]
        )

        expect(NewUpdate.update(
          withNewManifest: manifest,
          extensions: [:],
          config: config,
          database: database
        )).to(raiseException())
      }

      it("no launch asset") {
        let manifest = NewManifest(
          rawManifestJSON: [
            "runtimeVersion": "1",
            "id": "0eef8214-4833-4089-9dff-b4138a14f196",
            "createdAt": "2020-11-11T00:17:54.797Z",
          ]
        )

        expect(NewUpdate.update(
          withNewManifest: manifest,
          extensions: [:],
          config: config,
          database: database
        )).to(raiseException())
      }
    }
  }
}
