//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class EXUpdatesNewUpdateSpec : ExpoSpec {
  let config = EXUpdatesConfig.config(fromDictionary: [
    EXUpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test"
  ])
  let database = EXUpdatesDatabase()

  override func spec() {
    describe("instantiation") {
      it("all fields") {
        let manifest = EXManifestsNewManifest(
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

        let manifestHeaders = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: nil,
          manifestSignature: nil,
          signature: nil
        )

        expect(EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders,
          extensions: [:],
          config: self.config,
          database: self.database
        )).notTo(beNil())
      }

      it("no runtime version") {
        let manifest = EXManifestsNewManifest(
          rawManifestJSON: [
            "id": "0eef8214-4833-4089-9dff-b4138a14f196",
            "createdAt": "2020-11-11T00:17:54.797Z",
            "launchAsset": [
              "url": "https://url.to/bundle.js",
              "contentType": "application/javascript"
            ]
          ]
        )

        let manifestHeaders = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: nil,
          manifestSignature: nil,
          signature: nil
        )

        expect(EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders,
          extensions: [:],
          config: self.config,
          database: self.database
        )).to(raiseException())
      }

      it("no id") {
        let manifest = EXManifestsNewManifest(
          rawManifestJSON: [
            "runtimeVersion": "1",
            "createdAt": "2020-11-11T00:17:54.797Z",
            "launchAsset": [
              "url": "https://url.to/bundle.js",
              "contentType": "application/javascript"
            ]
          ]
        )

        let manifestHeaders = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: nil,
          manifestSignature: nil,
          signature: nil
        )

        expect(EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders,
          extensions: [:],
          config: self.config,
          database: self.database
        )).to(raiseException())
      }

      it("no created at") {
        let manifest = EXManifestsNewManifest(
          rawManifestJSON: [
            "runtimeVersion": "1",
            "id": "0eef8214-4833-4089-9dff-b4138a14f196",
            "launchAsset": [
              "url": "https://url.to/bundle.js",
              "contentType": "application/javascript"
            ]
          ]
        )

        let manifestHeaders = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: nil,
          manifestSignature: nil,
          signature: nil
        )

        expect(EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders,
          extensions: [:],
          config: self.config,
          database: self.database
        )).to(raiseException())
      }

      it("no launch asset") {
        let manifest = EXManifestsNewManifest(
          rawManifestJSON: [
            "runtimeVersion": "1",
            "id": "0eef8214-4833-4089-9dff-b4138a14f196",
            "createdAt": "2020-11-11T00:17:54.797Z",
          ]
        )

        let manifestHeaders = EXUpdatesManifestHeaders(
          protocolVersion: nil,
          serverDefinedHeaders: nil,
          manifestFilters: nil,
          manifestSignature: nil,
          signature: nil
        )

        expect(EXUpdatesNewUpdate.update(
          withNewManifest: manifest,
          manifestHeaders: manifestHeaders,
          extensions: [:],
          config: self.config,
          database: self.database
        )).to(raiseException())
      }
    }

    describe("dictionaryWithStructuredHeader") {
      it("SupportedTypes") {
        let header = "string=\"string-0000\", true=?1, false=?0, integer=47, decimal=47.5"
        let expected: [String : Any] = [
          "string": "string-0000",
          "true": true,
          "false": false,
          "integer": 47,
          "decimal": 47.5
        ]
        let actual = EXUpdatesNewUpdate.dictionaryWithStructuredHeader(header)
        expect(NSDictionary(dictionary: expected).isEqual(to: actual!)).to(beTrue())
      }
      
      it("IgnoresOtherTypes") {
        let header = "branch-name=\"rollout-1\", data=:w4ZibGV0w6ZydGUK:, list=(1 2)"
        let expected: [String : Any] = [
          "branch-name": "rollout-1"
        ]
        let actual = EXUpdatesNewUpdate.dictionaryWithStructuredHeader(header)
        expect(NSDictionary(dictionary: expected).isEqual(to: actual!)).to(beTrue())
      }
      
      it("IgnoresParameters") {
        let header = "abc=123;a=1;b=2"
        let expected: [String : Any] = [
          "abc": 123
        ]
        let actual = EXUpdatesNewUpdate.dictionaryWithStructuredHeader(header)
        expect(NSDictionary(dictionary: expected).isEqual(to: actual!)).to(beTrue())
      }
      
      it("Empty") {
        let header = ""
        let expected: [String : Any] = [:]
        let actual = EXUpdatesNewUpdate.dictionaryWithStructuredHeader(header)
        expect(NSDictionary(dictionary: expected).isEqual(to: actual!)).to(beTrue())
      }
      
      it("ParsingError") {
        let header = "bad dictionary"
        expect(EXUpdatesNewUpdate.dictionaryWithStructuredHeader(header)).to(beNil())
      }
    }
  }
}
