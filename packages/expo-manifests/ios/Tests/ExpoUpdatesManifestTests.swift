//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXManifests

@Suite("ExpoUpdatesManifest")
struct ExpoUpdatesManifestTests {
  @Suite("instantiation")
  struct InstantiationTests {
    @Test
    func `instantiates and reads properties`() throws {
      let manifestJson = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://classic-assets.eascdn.net/%40esamelson%2Fnative-component-list%2F39.0.0%2F01c86fd863cfee878068eebd40f165df-39.0.0-ios.js\",\"contentType\":\"application/javascript\"}}"
      let manifestData = manifestJson.data(using: .utf8)
      guard let manifestData = manifestData else {
        throw ManifestTestError.testError
      }
      let manifestJsonObject = try JSONSerialization.jsonObject(with: manifestData)
      guard let manifestJsonObject = manifestJsonObject as? [String: Any] else {
        throw ManifestTestError.testError
      }

      let manifest = ExpoUpdatesManifest(rawManifestJSON: manifestJsonObject)

      #expect(manifest.rawId() == "0eef8214-4833-4089-9dff-b4138a14f196")
      #expect(manifest.createdAt() == "2020-11-11T00:17:54.797Z")
      #expect(manifest.runtimeVersion() == "1")
      #expect(NSDictionary(dictionary: [
        "url": "https://classic-assets.eascdn.net/%40esamelson%2Fnative-component-list%2F39.0.0%2F01c86fd863cfee878068eebd40f165df-39.0.0-ios.js",
        "contentType": "application/javascript"
      ]).isEqual(to: manifest.launchAsset()) == true)
      #expect(manifest.assets() == nil)

      // from base class
      #expect(manifest.legacyId() == "0eef8214-4833-4089-9dff-b4138a14f196")
      #expect(manifest.revisionId() == nil)
      #expect(manifest.slug() == nil)
      #expect(manifest.appKey() == nil)
      #expect(manifest.name() == nil)
      #expect(manifest.version() == nil)
      #expect(manifest.notificationPreferences() == nil)
      #expect(manifest.updatesInfo() == nil)
      #expect(manifest.iosConfig() == nil)
      #expect(manifest.hostUri() == nil)
      #expect(manifest.orientation() == nil)
      #expect(manifest.experiments() == nil)
      #expect(manifest.developer() == nil)
      #expect(manifest.facebookAppId() == nil)
      #expect(manifest.facebookApplicationName() == nil)
      #expect(manifest.facebookAutoInitEnabled() == false)
      #expect(manifest.isDevelopmentMode() == false)
      #expect(manifest.isDevelopmentSilentLaunch() == false)
      #expect(manifest.isUsingDeveloperTool() == false)
      #expect(manifest.userInterfaceStyle() == nil)
      #expect(manifest.iosOrRootBackgroundColor() == nil)
      #expect(manifest.iosGoogleServicesFile() == nil)
      #expect(manifest.supportsRTL() == true)
    }
  }

  @Suite("SDK Version")
  struct SDKVersionTests {
    @Test
    func `is correct with valid numeric case`() {
      let manifestJson = [
        "extra": [
          "expoClient": [
            "sdkVersion": "39.0.0"
          ]
        ]
      ]
      let manifest = ExpoUpdatesManifest(rawManifestJSON: manifestJson)
      #expect(manifest.expoGoSDKVersion() == "39.0.0")
    }

    @Test
    func `is UNVERSIONED with valid unversioned case`() {
      let manifestJson = [
        "extra": [
          "expoClient": [
            "sdkVersion": "UNVERSIONED"
          ]
        ]
      ]
      let manifest = ExpoUpdatesManifest(rawManifestJSON: manifestJson)
      #expect(manifest.expoGoSDKVersion() == "UNVERSIONED")
    }
  }
}
