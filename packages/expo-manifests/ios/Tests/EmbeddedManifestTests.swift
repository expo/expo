//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXManifests

enum ManifestTestError: Error {
    case testError
}

@Suite("instantiation")
struct EmbeddedManifestTests {
  @Test
  func `instantiates and reads properties`() throws {
    let manifestJson = "{\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":1609975977832}"
    let manifestData = manifestJson.data(using: .utf8)
    guard let manifestData = manifestData else {
      throw ManifestTestError.testError
    }
    let manifestJsonObject = try JSONSerialization.jsonObject(with: manifestData)
    guard let manifestJsonObject = manifestJsonObject as? [String: Any] else {
      throw ManifestTestError.testError
    }

    let manifest = EmbeddedManifest(rawManifestJSON: manifestJsonObject)

    #expect(manifest.rawId() == "0eef8214-4833-4089-9dff-b4138a14f196")
    #expect(manifest.commitTimeNumber() == 1609975977832)
    #expect(manifest.metadata() == nil)

    // from base class
    #expect(manifest.stableLegacyId() == "0eef8214-4833-4089-9dff-b4138a14f196")
    #expect(manifest.scopeKey() == "0eef8214-4833-4089-9dff-b4138a14f196")
    #expect(manifest.easProjectId() == nil)
    #expect(manifest.expoGoSDKVersion() == nil)

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
