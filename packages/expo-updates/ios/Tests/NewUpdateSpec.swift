//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class NewUpdateSpec : ExpoSpec {
  let config = UpdatesConfig.config(fromDictionary: [
    UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test"
  ])
  let database = UpdatesDatabase()

  override func spec() {
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
          config: self.config,
          database: self.database
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
          config: self.config,
          database: self.database
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
          config: self.config,
          database: self.database
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
          config: self.config,
          database: self.database
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
          config: self.config,
          database: self.database
        )).to(raiseException())
      }
    }
  }
}
