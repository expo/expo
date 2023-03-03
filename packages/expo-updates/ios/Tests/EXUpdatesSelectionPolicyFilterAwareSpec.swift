//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class EXUpdatesSelectionPolicyFilterAwareSpec : ExpoSpec {
  override func spec() {
    var updateDefault1: EXUpdatesUpdate!
    var updateDefault2: EXUpdatesUpdate!
    var updateRollout0: EXUpdatesUpdate!
    var updateRollout1: EXUpdatesUpdate!
    var updateRollout2: EXUpdatesUpdate!
    var updateMultipleFilters: EXUpdatesUpdate!
    var updateNoMetadata: EXUpdatesUpdate!

    var selectionPolicy: EXUpdatesSelectionPolicy!
    var manifestFilters: [String: Any]!

    beforeEach {
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

      let runtimeVersion = "1.0"
      let scopeKey = "dummyScope"
      let config = EXUpdatesConfig.config(fromDictionary: [
        EXUpdatesConfig.EXUpdatesConfigRuntimeVersionKey: runtimeVersion,
        EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey
      ])
      let database = EXUpdatesDatabase()
      let manifestHeaders = EXUpdatesManifestHeaders(
        protocolVersion: nil,
        serverDefinedHeaders: nil,
        manifestFilters: nil,
        manifestSignature: nil,
        signature: nil
      )

      updateRollout0 = EXUpdatesNewUpdate.update(
        withNewManifest: EXManifestsNewManifest(rawManifestJSON: [
          "id": "079cde35-8433-4c17-81c8-7117c1513e71",
          "createdAt": "2021-01-10T19:39:22.480Z",
          "runtimeVersion": "1.0",
          "launchAsset": launchAsset,
          "assets": [imageAsset],
          "metadata": ["branchName": "rollout"]
        ]),
        manifestHeaders: manifestHeaders,
        extensions: [:],
        config: config,
        database: database
      )

      updateDefault1 = EXUpdatesNewUpdate.update(
        withNewManifest: EXManifestsNewManifest(rawManifestJSON: [
          "id": "079cde35-8433-4c17-81c8-7117c1513e72",
          "createdAt": "2021-01-11T19:39:22.480Z",
          "runtimeVersion": "1.0",
          "launchAsset": launchAsset,
          "assets": [imageAsset],
          "metadata": ["branchName": "default"]
        ]),
        manifestHeaders: manifestHeaders,
        extensions: [:],
        config: config,
        database: database
      )
      
      updateRollout1 = EXUpdatesNewUpdate.update(
        withNewManifest: EXManifestsNewManifest(rawManifestJSON: [
          "id": "079cde35-8433-4c17-81c8-7117c1513e73",
          "createdAt": "2021-01-12T19:39:22.480Z",
          "runtimeVersion": "1.0",
          "launchAsset": launchAsset,
          "assets": [imageAsset],
          "metadata": ["branchName": "rollout"]
        ]),
        manifestHeaders: manifestHeaders,
        extensions: [:],
        config: config,
        database: database
      )
      
      updateDefault2 = EXUpdatesNewUpdate.update(
        withNewManifest: EXManifestsNewManifest(rawManifestJSON: [
          "id": "079cde35-8433-4c17-81c8-7117c1513e74",
          "createdAt": "2021-01-13T19:39:22.480Z",
          "runtimeVersion": "1.0",
          "launchAsset": launchAsset,
          "assets": [imageAsset],
          "metadata": ["branchName": "default"]
        ]),
        manifestHeaders: manifestHeaders,
        extensions: [:],
        config: config,
        database: database
      )
      
      updateRollout2 = EXUpdatesNewUpdate.update(
        withNewManifest: EXManifestsNewManifest(rawManifestJSON: [
          "id": "079cde35-8433-4c17-81c8-7117c1513e75",
          "createdAt": "2021-01-14T19:39:22.480Z",
          "runtimeVersion": "1.0",
          "launchAsset": launchAsset,
          "assets": [imageAsset],
          "metadata": ["branchName": "rollout"]
        ]),
        manifestHeaders: manifestHeaders,
        extensions: [:],
        config: config,
        database: database
      )
      
      updateMultipleFilters = EXUpdatesNewUpdate.update(
        withNewManifest: EXManifestsNewManifest(rawManifestJSON: [
          "id": "079cde35-8433-4c17-81c8-7117c1513e72",
          "createdAt": "2021-01-11T19:39:22.480Z",
          "runtimeVersion": "1.0",
          "launchAsset": launchAsset,
          "assets": [imageAsset],
          "metadata": ["firstKey": "value1", "secondKey": "value2"]
        ]),
        manifestHeaders: manifestHeaders,
        extensions: [:],
        config: config,
        database: database
      )
      
      updateNoMetadata = EXUpdatesNewUpdate.update(
        withNewManifest: EXManifestsNewManifest(rawManifestJSON: [
          "id": "079cde35-8433-4c17-81c8-7117c1513e72",
          "createdAt": "2021-01-11T19:39:22.480Z",
          "runtimeVersion": "1.0",
          "launchAsset": launchAsset,
          "assets": [imageAsset]
        ]),
        manifestHeaders: manifestHeaders,
        extensions: [:],
        config: config,
        database: database
      )
      
      selectionPolicy = EXUpdatesSelectionPolicyFactory.filterAwarePolicy(withRuntimeVersion: runtimeVersion)
      manifestFilters = ["branchname": "rollout"]
    }
    
    describe("filtering") {
      it("launchable updates") {
        let actual = selectionPolicy.launchableUpdate(fromUpdates: [updateDefault1, updateRollout1, updateDefault2], filters: manifestFilters)
        expect(actual) == updateRollout1
      }
      
      it("delete - second newest matching") {
        let actual = selectionPolicy.updatesToDelete(withLaunchedUpdate: updateRollout2, updates: [updateRollout0, updateDefault1, updateRollout1, updateDefault2, updateRollout2], filters: manifestFilters)
        expect(actual.count) == 3
        
        expect(actual.contains(updateDefault1)) == true
        expect(actual.contains(updateDefault2)) == true
        expect(actual.contains(updateRollout0)) == true
        expect(actual.contains(updateRollout1)) == false
        expect(actual.contains(updateRollout2)) == false
      }
      
      it("delete - none older matching") {
        let actual = selectionPolicy.updatesToDelete(withLaunchedUpdate: updateRollout2, updates: [updateDefault1, updateDefault2, updateRollout2], filters: manifestFilters)
        expect(actual.count) == 1
        
        expect(actual.contains(updateDefault1)) == true
        expect(actual.contains(updateDefault2)) == false
        expect(actual.contains(updateRollout2)) == false
      }
      
      it("should load new update - normal case - new update") {
        expect(selectionPolicy.shouldLoadNewUpdate(updateRollout2, withLaunchedUpdate: updateRollout1, filters: manifestFilters)) == true
      }
      
      it("should load new update - normal case - no update") {
        expect(selectionPolicy.shouldLoadNewUpdate(updateRollout1, withLaunchedUpdate: updateRollout1, filters: manifestFilters)) == false
      }
      
      it("should load new update - normal case - older update") {
        // this could happen if the embedded update is newer than the most recently published update
        expect(selectionPolicy.shouldLoadNewUpdate(updateRollout1, withLaunchedUpdate: updateRollout2, filters: manifestFilters)) == false
      }
      
      it("should load new update - none matching filters") {
        expect(selectionPolicy.shouldLoadNewUpdate(updateRollout1, withLaunchedUpdate: updateDefault2, filters: manifestFilters)) == true
      }
      
      it("should load new update - newer exists") {
        expect(selectionPolicy.shouldLoadNewUpdate(updateRollout1, withLaunchedUpdate: updateRollout2, filters: manifestFilters)) == false
      }
      
      it("should load new update - doesnt match") {
        expect(selectionPolicy.shouldLoadNewUpdate(updateDefault2, withLaunchedUpdate: nil, filters: manifestFilters)) == false
      }
      
      it("does update match filters - multiple filters") {
        let filtersBadMatch = [
          "firstkey": "value1",
          "secondkey": "wrong-value"
        ]
        expect(EXUpdatesSelectionPolicies.doesUpdate(updateMultipleFilters, matchFilters: filtersBadMatch)) == false
        
        let filtersGoodMatch = [
          "firstkey": "value1",
          "secondkey": "value2"
        ]
        expect(EXUpdatesSelectionPolicies.doesUpdate(updateMultipleFilters, matchFilters: filtersGoodMatch)) == true
      }
      
      it("does update match filters - empty matches all") {
        expect(EXUpdatesSelectionPolicies.doesUpdate(updateDefault1, matchFilters: ["field-that-update-doesnt-have": "value"])) == true
      }
      
      it("does update match filters - null") {
        // null filters or null metadata (i.e. bare or legacy manifests) is counted as a match
        expect(EXUpdatesSelectionPolicies.doesUpdate(updateDefault1, matchFilters: nil)) == true
        expect(EXUpdatesSelectionPolicies.doesUpdate(updateNoMetadata, matchFilters: manifestFilters)) == true
      }
    }
  }
}
