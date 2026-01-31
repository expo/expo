//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

class UpdatesConfigTestsForBundle {}

@Suite("UpdatesConfig")
struct UpdatesConfigTests {
  // MARK: - instantiation from plist

  @Test
  func `instantiates from plist`() throws {
    let bundle = Bundle(for: UpdatesConfigTestsForBundle.self)
    let configPlistPath = bundle.path(forResource: "TestConfig", ofType: "plist")!
    guard let configNSDictionary = NSDictionary(contentsOfFile: configPlistPath) as? [String: Any] else {
      throw UpdatesConfigError.ExpoUpdatesConfigPlistError
    }
    let config = try UpdatesConfig.config(fromDictionary: configNSDictionary)
    #expect(config.scopeKey == "blah")
    #expect(config.updateUrl.absoluteString == "http://example.com")
    #expect(config.requestHeaders == ["Hello": "World"])
    #expect(config.launchWaitMs == 2)
    #expect(config.checkOnLaunch == .ErrorRecoveryOnly)
    #expect(config.codeSigningConfiguration != nil)
    #expect(config.enableExpoUpdatesProtocolV0CompatibilityMode == false)
    #expect(config.enableBsdiffPatchSupport == false)
    #expect(config.runtimeVersion == "fake-version-1")
    #expect(config.hasEmbeddedUpdate == true)
  }

  @Test
  func `overrides with merging-in map`() throws {
    let bundle = Bundle(for: UpdatesConfigTestsForBundle.self)
    let configPlistPath = bundle.path(forResource: "TestConfig", ofType: "plist")!

    // test overriding various keys
    let otherDictionary: [String: Any] = [
      UpdatesConfig.EXUpdatesConfigEnabledKey: false,
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "overridden",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "overridden",
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "http://google.com",
      UpdatesConfig.EXUpdatesConfigRequestHeadersKey: ["Foo": "Bar"],
      UpdatesConfig.EXUpdatesConfigEnableBsdiffPatchSupportKey: false,
    ]

    guard let configNSDictionary = NSDictionary(contentsOfFile: configPlistPath) as? [String: Any] else {
      throw UpdatesConfigError.ExpoUpdatesConfigPlistError
    }

    let dictionary: [String: Any] = configNSDictionary.merging(otherDictionary, uniquingKeysWith: { _, new in new })

    let config = try UpdatesConfig.config(fromDictionary: dictionary)
    #expect(config.scopeKey == "overridden")
    #expect(config.updateUrl.absoluteString == "http://google.com")
    #expect(config.requestHeaders == ["Foo": "Bar"])
    #expect(config.launchWaitMs == 2)
    #expect(config.checkOnLaunch == .ErrorRecoveryOnly)
    #expect(config.codeSigningConfiguration != nil)
    #expect(config.enableExpoUpdatesProtocolV0CompatibilityMode == false)
    #expect(config.enableBsdiffPatchSupport == false)
    #expect(config.runtimeVersion == "overridden")
    #expect(config.hasEmbeddedUpdate == true)
  }

  // MARK: - normalizedURLOrigin

  @Test
  func `normalizedURLOrigin is correct with no port`() {
    let urlNoPort = URL(string: "https://exp.host/test")!
    #expect(UpdatesConfig.normalizedURLOrigin(url: urlNoPort) == "https://exp.host")
  }

  @Test
  func `normalizedURLOrigin is correct with default port`() {
    let urlDefaultPort = URL(string: "https://exp.host:443/test")!
    #expect(UpdatesConfig.normalizedURLOrigin(url: urlDefaultPort) == "https://exp.host")
  }

  @Test
  func `normalizedURLOrigin is correct with other port`() {
    let urlOtherPort = URL(string: "https://exp.host:47/test")!
    #expect(UpdatesConfig.normalizedURLOrigin(url: urlOtherPort) == "https://exp.host:47")
  }

  // MARK: - isValidRequestHeadersOverride

  @Test
  func `should return true for headers matched with embedded headers`() {
    let originalHeaders = ["expo-channel-name": "default"]
    let requestHeadersOverride = ["Expo-Channel-Name": "preview"]
    let result = UpdatesConfig.isValidRequestHeadersOverride(
      originalEmbeddedRequestHeaders: originalHeaders,
      requestHeadersOverride: requestHeadersOverride
    )
    #expect(result == true)
  }

  @Test
  func `should return false for headers unmatched with embedded headers`() {
    let originalHeaders = ["expo-channel-name": "default"]
    let requestHeadersOverride = [
      "Expo-Channel-Name": "preview",
      "X-Custom": "custom"
    ]
    let result = UpdatesConfig.isValidRequestHeadersOverride(
      originalEmbeddedRequestHeaders: originalHeaders,
      requestHeadersOverride: requestHeadersOverride
    )
    #expect(result == false)
  }

  @Test
  func `should return false for Host override header`() {
    let originalHeaders = [
      "expo-channel-name": "default",
      "Host": "example.org"
    ]
    let requestHeadersOverride = [
      "Expo-Channel-Name": "preview",
      "Host": "override.org"
    ]
    let result = UpdatesConfig.isValidRequestHeadersOverride(
      originalEmbeddedRequestHeaders: originalHeaders,
      requestHeadersOverride: requestHeadersOverride
    )
    #expect(result == false)
  }

  @Test
  func `should handle Host override header normalization`() {
    let originalHeaders = [
      "expo-channel-name": "default",
      " Host ": "example.org"
    ]
    let requestHeadersOverride = [
      "Expo-Channel-Name": "preview",
      " Host ": "override.org"
    ]
    let result = UpdatesConfig.isValidRequestHeadersOverride(
      originalEmbeddedRequestHeaders: originalHeaders,
      requestHeadersOverride: requestHeadersOverride
    )
    #expect(result == false)
  }
}
