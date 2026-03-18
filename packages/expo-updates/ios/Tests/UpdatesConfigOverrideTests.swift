// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("UpdatesConfigOverride", .serialized)
@MainActor
struct UpdatesConfigOverrideTests {
  init() {
    UserDefaults.standard.removeObject(forKey: "dev.expo.updates.updatesConfigOverride")
  }

  // MARK: - Constructor

  @Test
  func createWithProvidedValues() {
    let updateUrl = URL(string: "https://example.com/manifest")
    let requestHeaders = ["Authorization": "Bearer token", "User-Agent": "ExpoApp"]

    let override = UpdatesConfigOverride(updateUrl: updateUrl, requestHeaders: requestHeaders)

    #expect(override.updateUrl == updateUrl)
    #expect(override.requestHeaders == requestHeaders)
  }

  @Test
  func createWithNullValues() {
    let override = UpdatesConfigOverride(updateUrl: nil, requestHeaders: nil)

    #expect(override.updateUrl == nil)
    #expect(override.requestHeaders == nil)
  }

  // MARK: - Load

  @Test
  func loadReturnsNilWhenNoStoredConfiguration() {
    #expect(UpdatesConfigOverride.load() == nil)
  }

  @Test
  func loadReturnsStoredConfiguration() {
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
  func loadReturnsPartialStoredConfiguration() {
    let requestHeaders = ["Authorization": "Bearer token"]
    let override = UpdatesConfigOverride(updateUrl: nil, requestHeaders: requestHeaders)
    UpdatesConfigOverride.save(configOverride: override)

    let result = UpdatesConfigOverride.load()

    #expect(result != nil)
    #expect(result?.updateUrl == nil)
    #expect(result?.requestHeaders == requestHeaders)
  }

  // MARK: - Save with configOverride

  @Test
  func saveStoresConfiguration() {
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
  func saveRemovesConfigurationWhenNil() {
    let override = UpdatesConfigOverride(updateUrl: URL(string: "https://example.com"), requestHeaders: ["key": "value"])
    UpdatesConfigOverride.save(configOverride: override)

    UpdatesConfigOverride.save(configOverride: nil)

    #expect(UpdatesConfigOverride.load() == nil)
  }

  // MARK: - Save with requestHeaders

  @Test
  func saveRequestHeadersCreatesNewOverride() {
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
  func saveRequestHeadersUpdatesExistingOverride() {
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
  func saveRequestHeadersReturnsNilWhenNilAndNoExisting() {
    let result = UpdatesConfigOverride.save(requestHeaders: nil)

    #expect(result == nil)
    #expect(UpdatesConfigOverride.load() == nil)
  }
}
