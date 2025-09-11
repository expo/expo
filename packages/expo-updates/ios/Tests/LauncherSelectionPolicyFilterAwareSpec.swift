// Copyright 2015-present 650 Industries. All rights reserved.

// swiftlint:disable closure_body_length
// swiftlint:disable force_try
// swiftlint:disable implicitly_unwrapped_optional

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

internal class LauncherSelectionPolicyFilterAwareSpec: ExpoSpec {
  override class func spec() {
    describe("update overrides") {
      let runtimeVersion = "1.0"
      let scopeKey = "dummyScope"
      let url = URL(string: "https://example.com")
      let headers = ["expo-channel-name": "default"]
      let overrideUrl = URL(string: "https://override.example.com")
      let overrideHeaders = ["expo-channal-name": "override"]
      let manifestFilters = ["branchname": "default"]

      let launchAsset = [
        "hash": "DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA",
        "key": "0436e5821bff7b95a84c21f22a43cb96.bundle",
        "contentType": "application/javascript",
        "fileExtension": ".js",
        "url": "https://url.to/bundle"
      ]

      let imageAsset = [
        "hash": "JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo",
        "key": "3261e570d51777be1e99116562280926.png",
        "contentType": "image/png",
        "fileExtension": ".png",
        "url": "https://url.to/asset"
      ]

      let config = try! UpdatesConfig.config(
        fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: url?.absoluteString ?? "",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: runtimeVersion,
          UpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
          UpdatesConfig.EXUpdatesConfigRequestHeadersKey: headers,
          UpdatesConfig.EXUpdatesConfigDisableAntiBrickingMeasures: true
        ]
      )
      let configWithOverride = try! UpdatesConfig.config(
        fromConfig: config,
        configOverride: UpdatesConfigOverride(updateUrl: overrideUrl, requestHeaders: overrideHeaders)
      )
      var database: UpdatesDatabase!
      var updateWithOverrideUrl: Update!
      var updateWithDifferentUrl: Update!
      var updateWithOverrideHeaders: Update!
      var updateWithDifferentHeaders: Update!

      beforeEach {
        database = UpdatesDatabase()

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
          config: try! UpdatesConfig.config(
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
          config: try! UpdatesConfig.config(
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
          config: try! UpdatesConfig.config(
            fromConfig: config,
            configOverride: UpdatesConfigOverride(updateUrl: nil, requestHeaders: ["Authorization": "Bearer different_token"])
          ),
          database: database
        )
      }

      it("should only return update matching override URL and headers") {
        let launcherPolicy = LauncherSelectionPolicyFilterAware(runtimeVersion: runtimeVersion, config: configWithOverride)
        let updates: [Update] = [updateWithOverrideUrl, updateWithDifferentUrl, updateWithOverrideHeaders, updateWithDifferentHeaders]

        let result = launcherPolicy.launchableUpdate(fromUpdates: updates, filters: manifestFilters)
        expect(result) == updateWithOverrideUrl
      }

      it("should return latest update matching override URL and headers") {
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
        expect(result) == updateOverrideLatest
      }

      it("should return nil when no updates match override URL") {
        let launcherPolicy = LauncherSelectionPolicyFilterAware(runtimeVersion: runtimeVersion, config: configWithOverride)
        let updates: [Update] = [updateWithDifferentUrl]
        let result = launcherPolicy.launchableUpdate(fromUpdates: updates, filters: manifestFilters)
        expect(result).to(beNil())
      }

      it("should return nil when no updates match override headers") {
        let launcherPolicy = LauncherSelectionPolicyFilterAware(runtimeVersion: runtimeVersion, config: configWithOverride)
        let updates: [Update] = [updateWithDifferentHeaders]
        let result = launcherPolicy.launchableUpdate(fromUpdates: updates, filters: manifestFilters)
        expect(result).to(beNil())
      }
    }
  }
}

// swiftlint:enable closure_body_length
// swiftlint:enable force_try
// swiftlint:enable implicitly_unwrapped_optional
