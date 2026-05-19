//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class ReaperSelectionPolicyFilterAwareSpec : ExpoSpec {
  override class func spec() {
    let runtimeVersion = "1.0"

    func createUpdate(
      commitTime: TimeInterval,
      scopeKey: String = "dummyScope",
      branchName: String? = nil,
      status: UpdateStatus = .StatusReady
    ) -> Update {
      let config = try! UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ])
      var manifestJSON: [String: Any] = [:]
      if let branchName = branchName {
        manifestJSON["metadata"] = ["branchName": branchName]
      }
      return Update(
        manifest: ManifestFactory.manifest(forManifestJSON: manifestJSON),
        config: config,
        database: UpdatesDatabase(),
        updateId: UUID(),
        scopeKey: scopeKey,
        commitTime: Date(timeIntervalSince1970: commitTime),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: status,
        isDevelopmentMode: false,
        assetsFromManifest: [],
        url: URL(string: "https://example.com"),
        requestHeaders: [:]
      )
    }

    describe("updates to delete") {
      it("should keep launched update and one older update by default") {
        let update1 = createUpdate(commitTime: 1608667851)
        let update2 = createUpdate(commitTime: 1608667852)
        let launchedUpdate = createUpdate(commitTime: 1608667853)
        let selectionPolicy = ReaperSelectionPolicyFilterAware()

        let updatesToDelete = selectionPolicy.updatesToDelete(
          withLaunchedUpdate: launchedUpdate,
          updates: [update1, update2, launchedUpdate],
          filters: nil
        )

        expect(updatesToDelete.count) == 1
        expect(updatesToDelete.contains(update1)) == true
        expect(updatesToDelete.contains(update2)) == false
        expect(updatesToDelete.contains(launchedUpdate)) == false
      }

      it("should keep configured max updates when older updates exist") {
        let update1 = createUpdate(commitTime: 1608667851)
        let update2 = createUpdate(commitTime: 1608667852)
        let update3 = createUpdate(commitTime: 1608667853)
        let launchedUpdate = createUpdate(commitTime: 1608667854)
        let selectionPolicy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: 3)

        let updatesToDelete = selectionPolicy.updatesToDelete(
          withLaunchedUpdate: launchedUpdate,
          updates: [update1, update2, update3, launchedUpdate],
          filters: nil
        )

        expect(updatesToDelete.count) == 1
        expect(updatesToDelete.contains(update1)) == true
        expect(updatesToDelete.contains(update2)) == false
        expect(updatesToDelete.contains(update3)) == false
        expect(updatesToDelete.contains(launchedUpdate)) == false
      }

      it("should reject maxUpdatesToKeep below two") {
        expect {
          _ = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: 1)
        }.to(raiseException())
      }

      it("should not delete newer updates") {
        let launchedUpdate = createUpdate(commitTime: 1608667851)
        let newerUpdate = createUpdate(commitTime: 1608667852)
        let selectionPolicy = ReaperSelectionPolicyFilterAware()

        let updatesToDelete = selectionPolicy.updatesToDelete(
          withLaunchedUpdate: launchedUpdate,
          updates: [launchedUpdate, newerUpdate],
          filters: nil
        )

        expect(updatesToDelete.count) == 0
      }

      it("should prefer older updates matching manifest filters") {
        let oldestMatchingUpdate = createUpdate(commitTime: 1608667851, branchName: "rollout")
        let olderDefaultUpdate = createUpdate(commitTime: 1608667852, branchName: "default")
        let nextNewestMatchingUpdate = createUpdate(commitTime: 1608667853, branchName: "rollout")
        let newestDefaultUpdate = createUpdate(commitTime: 1608667854, branchName: "default")
        let launchedUpdate = createUpdate(commitTime: 1608667855, branchName: "rollout")
        let selectionPolicy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: 3)

        let updatesToDelete = selectionPolicy.updatesToDelete(
          withLaunchedUpdate: launchedUpdate,
          updates: [oldestMatchingUpdate, olderDefaultUpdate, nextNewestMatchingUpdate, newestDefaultUpdate, launchedUpdate],
          filters: ["branchname": "rollout"]
        )

        expect(updatesToDelete.count) == 2
        expect(updatesToDelete.contains(oldestMatchingUpdate)) == false
        expect(updatesToDelete.contains(olderDefaultUpdate)) == true
        expect(updatesToDelete.contains(nextNewestMatchingUpdate)) == false
        expect(updatesToDelete.contains(newestDefaultUpdate)) == true
        expect(updatesToDelete.contains(launchedUpdate)) == false
      }

      it("should fill remaining retained slots with newest older updates") {
        let matchingUpdate = createUpdate(commitTime: 1608667851, branchName: "rollout")
        let olderDefaultUpdate = createUpdate(commitTime: 1608667852, branchName: "default")
        let newerDefaultUpdate = createUpdate(commitTime: 1608667853, branchName: "default")
        let launchedUpdate = createUpdate(commitTime: 1608667854, branchName: "rollout")
        let selectionPolicy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: 3)

        let updatesToDelete = selectionPolicy.updatesToDelete(
          withLaunchedUpdate: launchedUpdate,
          updates: [matchingUpdate, olderDefaultUpdate, newerDefaultUpdate, launchedUpdate],
          filters: ["branchname": "rollout"]
        )

        expect(updatesToDelete.count) == 1
        expect(updatesToDelete.contains(matchingUpdate)) == false
        expect(updatesToDelete.contains(olderDefaultUpdate)) == true
        expect(updatesToDelete.contains(newerDefaultUpdate)) == false
        expect(updatesToDelete.contains(launchedUpdate)) == false
      }

      it("should not delete updates from other scopes") {
        let update1 = createUpdate(commitTime: 1608667851)
        let update2 = createUpdate(commitTime: 1608667852)
        let launchedUpdate = createUpdate(commitTime: 1608667853, scopeKey: "differentScopeKey")
        let selectionPolicy = ReaperSelectionPolicyFilterAware()

        let updatesToDelete = selectionPolicy.updatesToDelete(
          withLaunchedUpdate: launchedUpdate,
          updates: [update1, update2, launchedUpdate],
          filters: nil
        )

        expect(updatesToDelete.count) == 0
      }

      it("should not delete embedded updates") {
        let embeddedUpdate = createUpdate(commitTime: 1608667851, status: .StatusEmbedded)
        let olderUpdate = createUpdate(commitTime: 1608667852)
        let launchedUpdate = createUpdate(commitTime: 1608667853)
        let selectionPolicy = ReaperSelectionPolicyFilterAware()

        let updatesToDelete = selectionPolicy.updatesToDelete(
          withLaunchedUpdate: launchedUpdate,
          updates: [embeddedUpdate, olderUpdate, launchedUpdate],
          filters: nil
        )

        expect(updatesToDelete.count) == 0
      }
    }
  }
}
