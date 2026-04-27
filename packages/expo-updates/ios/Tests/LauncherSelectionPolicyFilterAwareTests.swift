// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

@Suite("LauncherSelectionPolicyFilterAware", .serialized)
@MainActor
struct LauncherSelectionPolicyFilterAwareTests {
  let runtimeVersion = "1.0"
  let manifestFilters = ["branchname": "default"]
  let configWithOverride: UpdatesConfig
  let updateWithOverrideUrl: Update
  let updateWithDifferentUrl: Update
  let updateWithOverrideHeaders: Update
  let updateWithDifferentHeaders: Update

  let launchAsset: [String: String] = [
    "hash": "DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA",
    "key": "0436e5821bff7b95a84c21f22a43cb96.bundle",
    "contentType": "application/javascript",
    "fileExtension": ".js",
    "url": "https://url.to/bundle"
  ]

  let imageAsset: [String: String] = [
    "hash": "JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo",
    "key": "3261e570d51777be1e99116562280926.png",
    "contentType": "image/png",
    "fileExtension": ".png",
    "url": "https://url.to/asset"
  ]

  init() throws {
    let scopeKey = "dummyScope"
    let url = URL(string: "https://example.com")
    let headers = ["expo-channel-name": "default"]
    let overrideUrl = URL(string: "https://override.example.com")
    let overrideHeaders = ["expo-channal-name": "override"]

    let config = try UpdatesConfig.config(
      fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: url?.absoluteString ?? "",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: runtimeVersion,
        UpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
        UpdatesConfig.EXUpdatesConfigRequestHeadersKey: headers,
        UpdatesConfig.EXUpdatesConfigDisableAntiBrickingMeasures: true
      ]
    )
    configWithOverride = try UpdatesConfig.config(
      fromConfig: config,
      configOverride: UpdatesConfigOverride(updateUrl: overrideUrl, requestHeaders: overrideHeaders)
    )
    let database = UpdatesDatabase()

    updateWithOverrideUrl = ExpoUpdatesUpdate.update(
      withExpoUpdatesManifest: ExpoUpdatesManifest(rawManifestJSON: [
        "id": "079cde35-8433-4c17-81c8-7117c1513e76",
        "createdAt": "2021-01-15T19:39:22.480Z",
        "runtimeVersion": runtimeVersion,
        "launchAsset": launchAsset,
        "assets": [imageAsset],
        "metadata": ["branchName": "default"]
      ]),
      extensions: [:],
      config: configWithOverride,
      database: database
    )

    updateWithDifferentUrl = ExpoUpdatesUpdate.update(
      withExpoUpdatesManifest: ExpoUpdatesManifest(rawManifestJSON: [
        "id": "079cde35-8433-4c17-81c8-7117c1513e77",
        "createdAt": "2021-01-16T19:39:22.480Z",
        "runtimeVersion": runtimeVersion,
        "launchAsset": launchAsset,
        "assets": [imageAsset],
        "metadata": ["branchName": "default"]
      ]),
      extensions: [:],
      config: try UpdatesConfig.config(
        fromConfig: config,
        configOverride: UpdatesConfigOverride(updateUrl: URL(string: "https://different.example.com"), requestHeaders: [:])
      ),
      database: database
    )

    updateWithOverrideHeaders = ExpoUpdatesUpdate.update(
      withExpoUpdatesManifest: ExpoUpdatesManifest(rawManifestJSON: [
        "id": "079cde35-8433-4c17-81c8-7117c1513e78",
        "createdAt": "2021-01-17T19:39:22.480Z",
        "runtimeVersion": "1.0",
        "launchAsset": launchAsset,
        "assets": [imageAsset],
        "metadata": ["branchName": "default"]
      ]),
      extensions: [:],
      config: try UpdatesConfig.config(
        fromConfig: config,
        configOverride: UpdatesConfigOverride(updateUrl: nil, requestHeaders: overrideHeaders)
      ),
      database: database
    )

    updateWithDifferentHeaders = ExpoUpdatesUpdate.update(
      withExpoUpdatesManifest: ExpoUpdatesManifest(rawManifestJSON: [
        "id": "079cde35-8433-4c17-81c8-7117c1513e79",
        "createdAt": "2021-01-18T19:39:22.480Z",
        "runtimeVersion": runtimeVersion,
        "launchAsset": launchAsset,
        "assets": [imageAsset],
        "metadata": ["branchName": "default"]
      ]),
      extensions: [:],
      config: try UpdatesConfig.config(
        fromConfig: config,
        configOverride: UpdatesConfigOverride(updateUrl: nil, requestHeaders: ["Authorization": "Bearer different_token"])
      ),
      database: database
    )
  }

  @Test
  func shouldOnlyReturnUpdateMatchingOverrideUrlAndHeaders() {
    let launcherPolicy = LauncherSelectionPolicyFilterAware(runtimeVersion: runtimeVersion, config: configWithOverride)
    let updates: [Update] = [updateWithOverrideUrl, updateWithDifferentUrl, updateWithOverrideHeaders, updateWithDifferentHeaders]

    let result = launcherPolicy.launchableUpdate(fromUpdates: updates, filters: manifestFilters)
    #expect(result == updateWithOverrideUrl)
  }

  @Test
  func shouldReturnLatestUpdateMatchingOverrideUrlAndHeaders() throws {
    let overrideUrl = URL(string: "https://override.example.com")
    let overrideHeaders = ["expo-channal-name": "override"]
    let database = UpdatesDatabase()
    let config = try UpdatesConfig.config(
      fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: runtimeVersion,
        UpdatesConfig.EXUpdatesConfigScopeKeyKey: "dummyScope",
        UpdatesConfig.EXUpdatesConfigRequestHeadersKey: ["expo-channel-name": "default"],
        UpdatesConfig.EXUpdatesConfigDisableAntiBrickingMeasures: true
      ]
    )

    let updateOverrideLatest = ExpoUpdatesUpdate.update(
      withExpoUpdatesManifest: ExpoUpdatesManifest(rawManifestJSON: [
        "id": "079cde35-8433-4c17-81c8-7117c1513e76",
        "createdAt": "2025-01-15T19:39:22.480Z",
        "runtimeVersion": runtimeVersion,
        "launchAsset": launchAsset,
        "assets": [imageAsset],
        "metadata": ["branchName": "default"]
      ]),
      extensions: [:],
      config: config,
      database: database
    )
    updateOverrideLatest.url = overrideUrl
    updateOverrideLatest.requestHeaders = overrideHeaders

    let launcherPolicy = LauncherSelectionPolicyFilterAware(runtimeVersion: runtimeVersion, config: configWithOverride)
    let updates: [Update] = [updateWithOverrideUrl, updateWithDifferentUrl, updateOverrideLatest, updateWithOverrideHeaders, updateWithDifferentHeaders]

    let result = launcherPolicy.launchableUpdate(fromUpdates: updates, filters: manifestFilters)
    #expect(result == updateOverrideLatest)
  }

  @Test
  func shouldReturnNilWhenNoUpdatesMatchOverrideUrl() {
    let launcherPolicy = LauncherSelectionPolicyFilterAware(runtimeVersion: runtimeVersion, config: configWithOverride)
    let updates: [Update] = [updateWithDifferentUrl]
    let result = launcherPolicy.launchableUpdate(fromUpdates: updates, filters: manifestFilters)
    #expect(result == nil)
  }

  @Test
  func shouldReturnNilWhenNoUpdatesMatchOverrideHeaders() {
    let launcherPolicy = LauncherSelectionPolicyFilterAware(runtimeVersion: runtimeVersion, config: configWithOverride)
    let updates: [Update] = [updateWithDifferentHeaders]
    let result = launcherPolicy.launchableUpdate(fromUpdates: updates, filters: manifestFilters)
    #expect(result == nil)
  }
}
