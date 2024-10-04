//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class UpdatesConfigSpecForBundle {}

class UpdatesConfigSpec : ExpoSpec {
  override class func spec() {
    describe("instantiation from plist") {
      it("instantiates") {
        let bundle = Bundle(for: UpdatesConfigSpecForBundle.self)
        let configPlistPath = bundle.path(forResource: "TestConfig", ofType: "plist")!
        guard let configNSDictionary = NSDictionary(contentsOfFile: configPlistPath) as? [String: Any] else {
          throw UpdatesConfigError.ExpoUpdatesConfigPlistError
        }
        let config = try! UpdatesConfig.config(fromDictionary: configNSDictionary)
        expect(config.expectsSignedManifest) == true
        expect(config.scopeKey) == "blah"
        expect(config.updateUrl.absoluteString) == "http://example.com"
        expect(config.requestHeaders) == ["Hello": "World"]
        expect(config.releaseChannel) == "test"
        expect(config.launchWaitMs) == 2
        expect(config.checkOnLaunch) == .ErrorRecoveryOnly
        expect(config.codeSigningConfiguration).toNot(beNil())
        expect(config.enableExpoUpdatesProtocolV0CompatibilityMode) == false
        expect(config.sdkVersion) == "10.0.0"
        expect(config.runtimeVersionRaw) == "fake-version-1"
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

        guard let configNSDictionary = NSDictionary(contentsOfFile: configPlistPath) as? [String: Any] else {
          throw UpdatesConfigError.ExpoUpdatesConfigPlistError
        }

        var dictionary: [String: Any] = configNSDictionary.merging(otherDictionary, uniquingKeysWith: { _, new in new })

        let config = try! UpdatesConfig.config(fromDictionary: dictionary)
        expect(config.expectsSignedManifest) == false
        expect(config.scopeKey) == "overridden"
        expect(config.updateUrl.absoluteString) == "http://google.com"
        expect(config.requestHeaders) == ["Foo": "Bar"]
        expect(config.releaseChannel) == "test"
        expect(config.launchWaitMs) == 2
        expect(config.checkOnLaunch) == .ErrorRecoveryOnly
        expect(config.codeSigningConfiguration).toNot(beNil())
        expect(config.enableExpoUpdatesProtocolV0CompatibilityMode) == false
        expect(config.sdkVersion) == "10.0.0"
        expect(config.runtimeVersionRaw) == "fake-version-1"
        expect(config.hasEmbeddedUpdate) == true
      }
    }

    describe("getRuntimeVersion") {
      it("returns sdk version when only sdk version") {
        let sdkOnlyConfig = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
          "EXUpdatesScopeKey": "test",
          "EXUpdatesSDKVersion": "38.0.0"
        ])
        expect(sdkOnlyConfig.runtimeVersionRealized) == "38.0.0"
      }

      it("returns runtime version when only runtime version") {
        let runtimeOnlyConfig = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
          "EXUpdatesScopeKey": "test",
          "EXUpdatesRuntimeVersion": "1.0"
        ])
        expect(runtimeOnlyConfig.runtimeVersionRealized) == "1.0"
      }

      it("returns runtime version when both sdk and runtime version") {
        let bothConfig = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
          "EXUpdatesScopeKey": "test",
          "EXUpdatesSDKVersion": "38.0.0",
          "EXUpdatesRuntimeVersion": "1.0"
        ])
        expect(bothConfig.runtimeVersionRealized) == "1.0"
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
