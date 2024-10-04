//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class LegacyUpdateSpec : ExpoSpec {
  let config = UpdatesConfig.config(fromDictionary: [
    UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test"
  ])
  let selfHostedConfig = UpdatesConfig.config(fromDictionary: [
    UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://esamelson.github.io/self-hosting-test/ios-index.json",
    UpdatesConfig.EXUpdatesConfigSDKVersionKey: "38.0.0"
  ])
  let database = UpdatesDatabase()

  override func spec() {
    describe("bundledAssetBaseUrl") {
      it("expo domain") {
        let manifest = LegacyManifest(rawManifestJSON: [:])
        let expected = URL(string: "https://classic-assets.eascdn.net/~assets/")
        expect(LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: UpdatesConfig.config(fromDictionary: [UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test"]))) == expected
        expect(LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: UpdatesConfig.config(fromDictionary: [UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://expo.io/@test/test"]))) == expected
        expect(LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: UpdatesConfig.config(fromDictionary: [UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://expo.test/@test/test"]))) == expected
      }

      it("expo subdomain") {
        let manifest = LegacyManifest(rawManifestJSON: [:])
        let expected = URL(string: "https://classic-assets.eascdn.net/~assets/")
        expect(LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: UpdatesConfig.config(fromDictionary: [UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://staging.exp.host/@test/test"]))) == expected
        expect(LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: UpdatesConfig.config(fromDictionary: [UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://staging.expo.io/@test/test"]))) == expected
        expect(LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: UpdatesConfig.config(fromDictionary: [UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://staging.expo.test/@test/test"]))) == expected
      }

      it("AssetUrlOverride AbsoluteUrl") {
        let absoluteUrlString = "https://xxx.dev/~assets"
        let manifest = LegacyManifest(rawManifestJSON: ["assetUrlOverride": absoluteUrlString])
        let absoluteExpected = URL(string: absoluteUrlString)
        let absoluteActual = LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: self.selfHostedConfig)
        expect(absoluteActual) == absoluteExpected
      }

      it("AssetUrlOverride RelativeUrl") {
        let manifest = LegacyManifest(rawManifestJSON: ["assetUrlOverride": "my_assets"])
        let relativeExpected = URL(string: "https://esamelson.github.io/self-hosting-test/my_assets")
        let relativeActual = LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: self.selfHostedConfig)
        expect(relativeActual) == relativeExpected
      }

      it("AssetUrlOverride OriginRelativeUrl") {
        let manifest = LegacyManifest(rawManifestJSON: ["assetUrlOverride": "/my_assets"])
        let originRelativeExpected = URL(string: "https://esamelson.github.io/my_assets")
        let originRelativeActual = LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: self.selfHostedConfig)
        expect(originRelativeActual) == originRelativeExpected
      }

      it("AssetUrlOverride RelativeUrlDotSlash") {
        let manifest = LegacyManifest(rawManifestJSON: ["assetUrlOverride": "./my_assets"])
        let relativeDotSlashExpected = URL(string: "https://esamelson.github.io/self-hosting-test/my_assets")
        let relativeDotSlashActual = LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: self.selfHostedConfig)
        expect(relativeDotSlashActual) == relativeDotSlashExpected
      }

      it("AssetUrlOverride Normalize") {
        let manifest = LegacyManifest(rawManifestJSON: ["assetUrlOverride": "./a/../b"])
        let expected = URL(string: "https://esamelson.github.io/self-hosting-test/b")
        let actual = LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: self.selfHostedConfig)
        expect(actual) == expected
      }

      it("AssetUrlOverride NormalizeToHostname") {
        let manifest = LegacyManifest(rawManifestJSON: ["assetUrlOverride": "../b"])
        let expected = URL(string: "https://esamelson.github.io/b")
        let actual = LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config:self.selfHostedConfig)
        expect(actual) == expected
      }

      it("AssetUrlOverride NormalizePastHostname") {
        let manifest = LegacyManifest(rawManifestJSON: ["assetUrlOverride": "../../b"])
        let expected = URL(string: "https://esamelson.github.io/b")
        let actual = LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config:self.selfHostedConfig)
        expect(actual) == expected
      }

      it("AssetUrlOverride Default") {
        let manifest = LegacyManifest(rawManifestJSON: [:])
        let defaultExpected = URL(string: "https://esamelson.github.io/self-hosting-test/assets")
        let defaultActual = LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config:self.selfHostedConfig)
        expect(defaultActual) == defaultExpected
      }
    }

    describe("instantiation") {
      it("development") {
        // manifests served from a developer tool should not need the releaseId and commitTime fields
        let manifest = LegacyManifest(
          rawManifestJSON: [
            "sdkVersion": "39.0.0",
            "bundleUrl": "https://url.to/bundle.js",
            "developer": [
              "tool": "expo-cli"
            ]
          ]
        )
        expect(LegacyUpdate.update(withLegacyManifest: manifest, config: self.config, database: self.database)).notTo(beNil())
      }
      
      it("production all fields") {
        // production manifests should require the releaseId, commitTime, sdkVersion, and bundleUrl fields
        let manifest = LegacyManifest(
          rawManifestJSON: [
            "sdkVersion": "39.0.0",
            "releaseId": "0eef8214-4833-4089-9dff-b4138a14f196",
            "commitTime": "2020-11-11T00:17:54.797Z",
            "bundleUrl": "https://url.to/bundle.js"
          ]
        )
        expect(LegacyUpdate.update(withLegacyManifest: manifest, config: self.config, database: self.database)).notTo(beNil())
      }
      
      it("production no sdk version") {
        let manifest = LegacyManifest(
          rawManifestJSON: [
            "releaseId": "0eef8214-4833-4089-9dff-b4138a14f196",
            "commitTime": "2020-11-11T00:17:54.797Z",
            "bundleUrl": "https://url.to/bundle.js"
          ]
        )
        expect(LegacyUpdate.update(withLegacyManifest: manifest, config: self.config, database: self.database)).to(raiseException())
      }
      
      it("production no releaseId") {
        let manifest = LegacyManifest(
          rawManifestJSON: [
            "sdkVersion": "39.0.0",
            "commitTime": "2020-11-11T00:17:54.797Z",
            "bundleUrl": "https://url.to/bundle.js"
          ]
        )
        expect(LegacyUpdate.update(withLegacyManifest: manifest, config: self.config, database: self.database)).to(raiseException())
      }
      
      it("production no commitTime") {
        let manifest = LegacyManifest(
          rawManifestJSON: [
            "sdkVersion": "39.0.0",
            "releaseId": "0eef8214-4833-4089-9dff-b4138a14f196",
            "bundleUrl": "https://url.to/bundle.js"
          ]
        )
        expect(LegacyUpdate.update(withLegacyManifest: manifest, config: self.config, database: self.database)).to(raiseException())
      }
      
      it("production no bundleUrl") {
        let manifest = LegacyManifest(
          rawManifestJSON: [
            "sdkVersion": "39.0.0",
            "releaseId": "0eef8214-4833-4089-9dff-b4138a14f196",
            "commitTime": "2020-11-11T00:17:54.797Z",
          ]
        )
        expect(LegacyUpdate.update(withLegacyManifest: manifest, config: self.config, database: self.database)).to(raiseException())
      }
      
      it("setsUpdateRuntimeAsSdkIfNoManifestRuntime") {
        let sdkVersion = "39.0.0"
        let manifest = LegacyManifest(
          rawManifestJSON: [
            "sdkVersion": sdkVersion,
            "releaseId": "0eef8214-4833-4089-9dff-b4138a14f196",
            "bundleUrl": "https://url.to/bundle.js",
            "commitTime": "2020-11-11T00:17:54.797Z"
          ]
        )
        let update = LegacyUpdate.update(withLegacyManifest: manifest, config: self.config, database: self.database)
        expect(update.runtimeVersion) == sdkVersion
      }
      
      it("setsUpdateRuntimeAsRuntimeIfBothManifestRuntime") {
        let sdkVersion = "39.0.0"
        let runtimeVersion = "hello"
        let manifest = LegacyManifest(
          rawManifestJSON: [
            "runtimeVersion": runtimeVersion,
            "sdkVersion": sdkVersion,
            "releaseId": "0eef8214-4833-4089-9dff-b4138a14f196",
            "bundleUrl": "https://url.to/bundle.js",
            "commitTime": "2020-11-11T00:17:54.797Z"
          ]
        )
        let update = LegacyUpdate.update(withLegacyManifest: manifest, config: self.config, database: self.database)
        expect(update.runtimeVersion) == runtimeVersion
      }
    }
  }
}
