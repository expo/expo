//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXManifests

enum ManifestTestError: Error {
    case testError
}

class BareManifestSpec : ExpoSpec {
  override class func spec() {
    describe("instantiation") {
      it("instantiates and reads properties") {
        let manifestJson = "{\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":1609975977832}"
        let manifestData = manifestJson.data(using: .utf8)
        guard let manifestData = manifestData else {
          throw ManifestTestError.testError
        }
        let manifestJsonObject = try JSONSerialization.jsonObject(with: manifestData)
        guard let manifestJsonObject = manifestJsonObject as? [String: Any] else {
          throw ManifestTestError.testError
        }

        let manifest = BareManifest(rawManifestJSON: manifestJsonObject)

        expect(manifest.rawId()) == "0eef8214-4833-4089-9dff-b4138a14f196"
        expect(manifest.commitTimeNumber()) == 1609975977832
        expect(manifest.metadata()).to(beNil())

        // from base class
        expect(manifest.stableLegacyId()) == "0eef8214-4833-4089-9dff-b4138a14f196"
        expect(manifest.scopeKey()) == "0eef8214-4833-4089-9dff-b4138a14f196"
        expect(manifest.easProjectId()).to(beNil())
        expect(manifest.expoGoSDKVersion()).to(beNil())

        // from base base class
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
  }
}
