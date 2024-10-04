//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class UpdatesConfigSpecForBundle {}

class UpdatesConfigSpec : ExpoSpec {
  override func spec() {
    describe("instantiation from plist") {
      it("instantiates") {
        let bundle = Bundle(for: UpdatesConfigSpecForBundle.self)
        let configPlistPath = bundle.path(forResource: "TestConfig", ofType: "plist")!
        let config = try UpdatesConfig.configWithExpoPlist(configPlistPath: configPlistPath, mergingOtherDictionary: nil)
        expect(config.isEnabled) == true
        expect(config.expectsSignedManifest) == true
        expect(config.scopeKey) == "blah"
        expect(config.updateUrl?.absoluteString) == "http://example.com"
        expect(config.requestHeaders) == ["Hello": "World"]
        expect(config.releaseChannel) == "test"
        expect(config.launchWaitMs) == 2
        expect(config.checkOnLaunch) == .ErrorRecoveryOnly
        expect(config.codeSigningConfiguration).toNot(beNil())
        expect(config.enableExpoUpdatesProtocolV0CompatibilityMode) == false
        expect(config.sdkVersion) == "10.0.0"
        expect(config.runtimeVersion) == "fake-version-1"
        expect(config.hasEmbeddedUpdate) == true
      }

      it("overrides with merging-in map") {
        let bundle = Bundle(for: UpdatesConfigSpecForBundle.self)
        let configPlistPath = bundle.path(forResource: "TestConfig", ofType: "plist")!

        // test overriding various keys
        let otherDictionary = [
          UpdatesConfig.EXUpdatesConfigEnabledKey: false,
          UpdatesConfig.EXUpdatesConfigScopeKeyKey: "overridden",
          UpdatesConfig.EXUpdatesConfigExpectsSignedManifestKey: false,
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "http://google.com",
          UpdatesConfig.EXUpdatesConfigRequestHeadersKey: ["Foo": "Bar"],
        ]

        let config = try UpdatesConfig.configWithExpoPlist(configPlistPath: configPlistPath, mergingOtherDictionary: otherDictionary)
        expect(config.isEnabled) == false
        expect(config.expectsSignedManifest) == false
        expect(config.scopeKey) == "overridden"
        expect(config.updateUrl?.absoluteString) == "http://google.com"
        expect(config.requestHeaders) == ["Foo": "Bar"]
        expect(config.releaseChannel) == "test"
        expect(config.launchWaitMs) == 2
        expect(config.checkOnLaunch) == .ErrorRecoveryOnly
        expect(config.codeSigningConfiguration).toNot(beNil())
        expect(config.enableExpoUpdatesProtocolV0CompatibilityMode) == false
        expect(config.sdkVersion) == "10.0.0"
        expect(config.runtimeVersion) == "fake-version-1"
        expect(config.hasEmbeddedUpdate) == true
      }
    }

    describe("getRuntimeVersion") {
      it("returns sdk version when only sdk version") {
        let sdkOnlyConfig = UpdatesConfig.config(fromDictionary: [
          "EXUpdatesScopeKey": "test",
          "EXUpdatesSDKVersion": "38.0.0"
        ])
        expect(UpdatesUtils.getRuntimeVersion(withConfig: sdkOnlyConfig)) == "38.0.0"
      }

      it("returns runtime version when only runtime version") {
        let runtimeOnlyConfig = UpdatesConfig.config(fromDictionary: [
          "EXUpdatesScopeKey": "test",
          "EXUpdatesRuntimeVersion": "1.0"
        ])
        expect(UpdatesUtils.getRuntimeVersion(withConfig: runtimeOnlyConfig)) == "1.0"
      }

      it("returns runtime version when both sdk and runtime version") {
        let bothConfig = UpdatesConfig.config(fromDictionary: [
          "EXUpdatesScopeKey": "test",
          "EXUpdatesSDKVersion": "38.0.0",
          "EXUpdatesRuntimeVersion": "1.0"
        ])
        expect(UpdatesUtils.getRuntimeVersion(withConfig: bothConfig)) == "1.0"
      }
    }

    describe("normalizedURLOrigin") {
      it("is correct with no port") {
        let urlNoPort = URL(string: "https://exp.host/test")!
        expect(UpdatesConfig.normalizedURLOrigin(url: urlNoPort)) == "https://exp.host"
      }

      it("is correct with default port") {
        let urlDefaultPort = URL(string: "https://exp.host:443/test")!
        expect(UpdatesConfig.normalizedURLOrigin(url: urlDefaultPort)) == "https://exp.host"
      }

      it("is correct with other port") {
        let urlOtherPort = URL(string: "https://exp.host:47/test")!
        expect(UpdatesConfig.normalizedURLOrigin(url: urlOtherPort)) == "https://exp.host:47"
      }
    }
  }
}
