//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXManifests

class LegacyManifestSpec : ExpoSpec {
  override func spec() {
    describe("instantiation") {
      it("instantiates and reads properties") {
        let manifestJson = "{\"sdkVersion\":\"39.0.0\",\"id\":\"@esamelson/native-component-list\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fnative-component-list%2F39.0.0%2F01c86fd863cfee878068eebd40f165df-39.0.0-ios.js\"}"
        let manifestData = manifestJson.data(using: .utf8)
        guard let manifestData = manifestData else {
          throw ManifestTestError.testError
        }
        let manifestJsonObject = try JSONSerialization.jsonObject(with: manifestData)
        guard let manifestJsonObject = manifestJsonObject as? [String: Any] else {
          throw ManifestTestError.testError
        }

        let manifest = LegacyManifest(rawManifestJSON: manifestJsonObject)

        expect(manifest.releaseID()) == "0eef8214-4833-4089-9dff-b4138a14f196"
        expect(manifest.commitTime()) == "2020-11-11T00:17:54.797Z"
        expect(manifest.bundledAssets()).to(beNil())
        expect(manifest.runtimeVersion()).to(beNil())
        expect(manifest.bundleKey()).to(beNil())
        expect(manifest.assetUrlOverride()).to(beNil())

        // from base class
        expect(manifest.stableLegacyId()) == "@esamelson/native-component-list"
        expect(manifest.scopeKey()) == "@esamelson/native-component-list"
        expect(manifest.easProjectId()).to(beNil())
        expect(manifest.bundleUrl()) == "https://classic-assets.eascdn.net/%40esamelson%2Fnative-component-list%2F39.0.0%2F01c86fd863cfee878068eebd40f165df-39.0.0-ios.js"
        expect(manifest.expoGoSDKVersion()) == "39.0.0"

        // from base base class
        expect(manifest.legacyId()) == "@esamelson/native-component-list"
        expect(manifest.revisionId()).to(beNil())
        expect(manifest.slug()).to(beNil())
        expect(manifest.appKey()).to(beNil())
        expect(manifest.name()).to(beNil())
        expect(manifest.version()).to(beNil())
        expect(manifest.notificationPreferences()).to(beNil())
        expect(manifest.updatesInfo()).to(beNil())
        expect(manifest.iosConfig()).to(beNil())
        expect(manifest.hostUri()).to(beNil())
        expect(manifest.orientation()).to(beNil())
        expect(manifest.experiments()).to(beNil())
        expect(manifest.developer()).to(beNil())
        expect(manifest.logUrl()).to(beNil())
        expect(manifest.facebookAppId()).to(beNil())
        expect(manifest.facebookApplicationName()).to(beNil())
        expect(manifest.facebookAutoInitEnabled()) == false
        expect(manifest.isDevelopmentMode()) == false
        expect(manifest.isDevelopmentSilentLaunch()) == false
        expect(manifest.isUsingDeveloperTool()) == false
        expect(manifest.userInterfaceStyle()).to(beNil())
        expect(manifest.iosOrRootBackgroundColor()).to(beNil())
        expect(manifest.iosSplashBackgroundColor()).to(beNil())
        expect(manifest.iosSplashImageUrl()).to(beNil())
        expect(manifest.iosSplashImageResizeMode()).to(beNil())
        expect(manifest.iosGoogleServicesFile()).to(beNil())
        expect(manifest.supportsRTL()) == false
        expect(manifest.jsEngine()) == "jsc"
      }
    }
  }
}
