// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("UpdatesConfigOverride", .serialized)
struct UpdatesConfigOverrideTests {
  private static func clearStoredConfiguration() {
    // Clear UserDefaults before each test
    UserDefaults.standard.removeObject(forKey: "dev.expo.updates.updatesConfigOverride")
  }

  @Suite("constructor", .serialized)
  struct ConstructorTests {
    init() {
      UpdatesConfigOverrideTests.clearStoredConfiguration()
    }

    @Test
    func `should create instance with provided values`() {
      let updateUrl = URL(string: "https://example.com/manifest")
      let requestHeaders = ["Authorization": "Bearer token", "User-Agent": "ExpoApp"]

      let override = UpdatesConfigOverride(updateUrl: updateUrl, requestHeaders: requestHeaders)

      #expect(override.updateUrl == updateUrl)
      #expect(override.requestHeaders == requestHeaders)
    }

    @Test
    func `should create instance with null values`() {
      let override = UpdatesConfigOverride(updateUrl: nil, requestHeaders: nil)

      #expect(override.updateUrl == nil)
      #expect(override.requestHeaders == nil)
    }
  }

  @Suite("load", .serialized)
  struct LoadTests {
    init() {
      UpdatesConfigOverrideTests.clearStoredConfiguration()
    }

    @Test
    func `should return nil when no stored configuration exists`() {
      let result = UpdatesConfigOverride.load()

      #expect(result == nil)
    }

    @Test
    func `should return configuration when stored configuration exists`() {
      let updateUrl = URL(string: "https://example.com/manifest")
      let requestHeaders = ["Authorization": "Bearer token"]
      let override = UpdatesConfigOverride(updateUrl: updateUrl, requestHeaders: requestHeaders)
      UpdatesConfigOverride.save(configOverride: override)

      let result = UpdatesConfigOverride.load()

      #expect(result != nil)
      #expect(result?.updateUrl == updateUrl)
      #expect(result?.requestHeaders == requestHeaders)
    }

    @Test
    func `should return configuration from partial stored configurations`() {
      let requestHeaders = ["Authorization": "Bearer token"]
      let override = UpdatesConfigOverride(updateUrl: nil, requestHeaders: requestHeaders)
      UpdatesConfigOverride.save(configOverride: override)

      let result = UpdatesConfigOverride.load()

      #expect(result != nil)
      #expect(result?.updateUrl == nil)
      #expect(result?.requestHeaders == requestHeaders)
    }
  }

  @Suite("save with configOverride", .serialized)
  struct SaveWithConfigOverrideTests {
    init() {
      UpdatesConfigOverrideTests.clearStoredConfiguration()
    }

    @Test
    func `should store configuration when override is not null`() {
      let updateUrl = URL(string: "https://example.com/manifest")
      let requestHeaders = ["Authorization": "Bearer token"]
      let override = UpdatesConfigOverride(updateUrl: updateUrl, requestHeaders: requestHeaders)

      UpdatesConfigOverride.save(configOverride: override)

      let result = UpdatesConfigOverride.load()
      #expect(result != nil)
      #expect(result?.updateUrl == updateUrl)
      #expect(result?.requestHeaders == requestHeaders)
    }

    @Test
    func `should remove configuration when override is null`() {
      let override = UpdatesConfigOverride(updateUrl: URL(string: "https://example.com"), requestHeaders: ["key": "value"])
      UpdatesConfigOverride.save(configOverride: override)

      UpdatesConfigOverride.save(configOverride: nil)

      let result = UpdatesConfigOverride.load()
      #expect(result == nil)
    }
  }

  @Suite("save with requestHeaders", .serialized)
  struct SaveWithRequestHeadersTests {
    init() {
      UpdatesConfigOverrideTests.clearStoredConfiguration()
    }

    @Test
    func `should create new override when none exists`() {
      let requestHeaders = ["Authorization": "Bearer token"]

      let result = UpdatesConfigOverride.save(requestHeaders: requestHeaders)

      #expect(result != nil)
      #expect(result?.updateUrl == nil)
      #expect(result?.requestHeaders == requestHeaders)

      let loaded = UpdatesConfigOverride.load()
      #expect(loaded?.updateUrl == nil)
      #expect(loaded?.requestHeaders == requestHeaders)
    }

    @Test
    func `should update existing override`() {
      let existingUrl = URL(string: "https://example.com/manifest")
      let existingOverride = UpdatesConfigOverride(updateUrl: existingUrl, requestHeaders: nil)
      UpdatesConfigOverride.save(configOverride: existingOverride)

      let newHeaders = ["User-Agent": "ExpoApp"]

      let result = UpdatesConfigOverride.save(requestHeaders: newHeaders)

      #expect(result != nil)
      #expect(result?.updateUrl == existingUrl)
      #expect(result?.requestHeaders == newHeaders)
    }

    @Test
    func `should return nil when requestHeaders is nil and no other values exist`() {
      let result = UpdatesConfigOverride.save(requestHeaders: nil)

      #expect(result == nil)
      #expect(UpdatesConfigOverride.load() == nil)
    }
  }
}
