// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

@Suite("LoaderSelectionPolicyFilterAware", .serialized)
@MainActor
struct LoaderSelectionPolicyFilterAwareTests {
  let runtimeVersion = "1.0"
  let manifestFilters = ["branchname": "default"]
  let config: UpdatesConfig
  let configWithOverride: UpdatesConfig
  let updateDefault1: Update
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

    config = try UpdatesConfig.config(
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

    updateDefault1 = ExpoUpdatesUpdate.update(
      withExpoUpdatesManifest: ExpoUpdatesManifest(rawManifestJSON: [
        "id": "079cde35-8433-4c17-81c8-7117c1513e72",
        "createdAt": "2021-01-11T19:39:22.480Z",
        "runtimeVersion": "1.0",
        "launchAsset": launchAsset,
        "assets": [imageAsset],
        "metadata": ["branchName": "default"]
      ]),
      extensions: [:],
      config: config,
      database: database
    )

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
  func shouldLoadNewUpdateWhenItMatchesOverrideUrlAndHeaders() {
    let loaderPolicy = LoaderSelectionPolicyFilterAware(config: configWithOverride)
    let result = loaderPolicy.shouldLoadNewUpdate(updateWithOverrideUrl, withLaunchedUpdate: updateDefault1, filters: manifestFilters)
    #expect(result == true)
  }

  @Test
  func shouldNotLoadSameUpdateEvenIfMatchesOverride() {
    let loaderPolicy = LoaderSelectionPolicyFilterAware(config: configWithOverride)
    let result = loaderPolicy.shouldLoadNewUpdate(updateWithOverrideUrl, withLaunchedUpdate: updateWithOverrideUrl, filters: manifestFilters)
    #expect(result == false)
  }

  @Test
  func shouldNotLoadNewUpdateWhenUrlDoesNotMatchOverride() {
    let loaderPolicy = LoaderSelectionPolicyFilterAware(config: configWithOverride)
    let result = loaderPolicy.shouldLoadNewUpdate(updateWithDifferentUrl, withLaunchedUpdate: updateDefault1, filters: manifestFilters)
    #expect(result == false)
  }

  @Test
  func shouldNotLoadNewUpdateWhenHeadersDoNotMatchOverride() {
    let loaderPolicy = LoaderSelectionPolicyFilterAware(config: configWithOverride)
    let result = loaderPolicy.shouldLoadNewUpdate(updateWithDifferentHeaders, withLaunchedUpdate: updateDefault1, filters: manifestFilters)
    #expect(result == false)
  }

  @Test
  func shouldLoadNewUpdateWhenLaunchedUpdateDoesNotMatchFilters() {
    let loaderPolicy = LoaderSelectionPolicyFilterAware(config: configWithOverride)
    let result = loaderPolicy.shouldLoadNewUpdate(updateWithOverrideUrl, withLaunchedUpdate: updateDefault1, filters: manifestFilters)
    #expect(result == true)
  }

  @Test
  func shouldNotLoadNewUpdateThatDoesNotMatchFilters() throws {
    let database = UpdatesDatabase()
    let overrideUrl = URL(string: "https://override.example.com")
    let overrideHeaders = ["expo-channal-name": "override"]

    let updateOverrideWithDifferentBranch = ExpoUpdatesUpdate.update(
      withExpoUpdatesManifest: ExpoUpdatesManifest(rawManifestJSON: [
        "id": "079cde35-8433-4c17-81c8-7117c1513e76",
        "createdAt": "2021-01-15T19:39:22.480Z",
        "runtimeVersion": runtimeVersion,
        "launchAsset": launchAsset,
        "assets": [imageAsset],
        "metadata": ["branchName": "somethingNew"]
      ]),
      extensions: [:],
      config: config,
      database: database
    )
    updateWithOverrideUrl.url = overrideUrl
    updateWithOverrideUrl.requestHeaders = overrideHeaders

    let loaderPolicy = LoaderSelectionPolicyFilterAware(config: configWithOverride)
    let result = loaderPolicy.shouldLoadNewUpdate(updateOverrideWithDifferentBranch, withLaunchedUpdate: updateDefault1, filters: manifestFilters)
    #expect(result == false)
  }
}
