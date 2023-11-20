//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXManifests

class NewManifestSpec : ExpoSpec {
  override class func spec() {
    describe("instantiation") {
      it("instantiates and reads properties") {
        let manifestJson = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://classic-assets.eascdn.net/%40esamelson%2Fnative-component-list%2F39.0.0%2F01c86fd863cfee878068eebd40f165df-39.0.0-ios.js\",\"contentType\":\"application/javascript\"}}"
        let manifestData = manifestJson.data(using: .utf8)
        guard let manifestData = manifestData else {
          throw ManifestTestError.testError
        }
        let manifestJsonObject = try JSONSerialization.jsonObject(with: manifestData)
        guard let manifestJsonObject = manifestJsonObject as? [String: Any] else {
          throw ManifestTestError.testError
        }

        let manifest = NewManifest(rawManifestJSON: manifestJsonObject)

        expect(manifest.rawId()) == "0eef8214-4833-4089-9dff-b4138a14f196"
        expect(manifest.createdAt()) == "2020-11-11T00:17:54.797Z"
        expect(manifest.runtimeVersion()) == "1"
        expect(NSDictionary(dictionary: [
          "url": "https://classic-assets.eascdn.net/%40esamelson%2Fnative-component-list%2F39.0.0%2F01c86fd863cfee878068eebd40f165df-39.0.0-ios.js",
          "contentType": "application/javascript"
        ]).isEqual(to: manifest.launchAsset())) == true
        expect(manifest.assets()).to(beNil())

        // from base class
        expect(manifest.legacyId()) == "0eef8214-4833-4089-9dff-b4138a14f196"
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
        expect(manifest.jsEngine()) == "hermes"
      }
    }

    describe("SDK Version") {
      it("is correct with valid numeric case") {
        let runtimeVersion = "exposdk:39.0.0"
        let manifestJson = ["runtimeVersion": runtimeVersion]
        let manifest = NewManifest(rawManifestJSON: manifestJson)
        expect(manifest.expoGoSDKVersion()) == "39.0.0"
      }

      it("is UNVERSIONED with valid unversioned case") {
        let runtimeVersion = "exposdk:UNVERSIONED"
        let manifestJson = ["runtimeVersion": runtimeVersion]
        let manifest = NewManifest(rawManifestJSON: manifestJson)
        expect(manifest.expoGoSDKVersion()) == "UNVERSIONED"
      }

      it("is nil with non-sdk runtime version cases") {
        let runtimeVersions = [
          "exposdk:123",
          "exposdkd:39.0.0",
          "exposdk:hello",
          "bexposdk:39.0.0",
          "exposdk:39.0.0-beta.0",
          "exposdk:39.0.0-alpha.256"
        ]

        for runtimeVersion in runtimeVersions {
          let manifestJson = ["runtimeVersion": runtimeVersion]
          let manifest = NewManifest(rawManifestJSON: manifestJson)
          expect(manifest.expoGoSDKVersion()).to(beNil())
        }
      }
    }
  }
}
