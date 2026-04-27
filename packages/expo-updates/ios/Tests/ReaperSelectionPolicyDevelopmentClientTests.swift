//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

@Suite("ReaperSelectionPolicyDevelopmentClient", .serialized)
@MainActor
struct ReaperSelectionPolicyDevelopmentClientTests {
  var update1: Update
  var update2: Update
  var update3: Update
  var update4: Update
  var update5: Update
  var selectionPolicy: ReaperSelectionPolicy

  init() throws {
    let runtimeVersion = "1.0"
    let database = UpdatesDatabase()

    func makeUpdate(scopeKey: String, commitTime: TimeInterval) throws -> Update {
      Update(
        manifest: ManifestFactory.manifest(forManifestJSON: [:]),
        config: try UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
          UpdatesConfig.EXUpdatesConfigScopeKeyKey: scopeKey,
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ]),
        database: database,
        updateId: UUID(),
        scopeKey: scopeKey,
        commitTime: Date(timeIntervalSince1970: commitTime),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: .StatusReady,
        isDevelopmentMode: false,
        assetsFromManifest: [],
        url: URL(string: "https://example.com"),
        requestHeaders: [:]
      )
    }

    // test updates with different scopes to ensure this policy ignores scopes
    update1 = try makeUpdate(scopeKey: "scope1", commitTime: 1608667851)
    update2 = try makeUpdate(scopeKey: "scope2", commitTime: 1608667852)
    update3 = try makeUpdate(scopeKey: "scope3", commitTime: 1608667853)
    update4 = try makeUpdate(scopeKey: "scope4", commitTime: 1608667854)
    update5 = try makeUpdate(scopeKey: "scope5", commitTime: 1608667855)

    // for readability/writability, test with a policy that keeps only 3 updates;
    // the actual functionality is independent of the number
    selectionPolicy = ReaperSelectionPolicyDevelopmentClient(maxUpdatesToKeep: 3)
  }

  @Test
  func basicCase() {
    update1.lastAccessed = Date(timeIntervalSince1970: 1619569811)
    update2.lastAccessed = Date(timeIntervalSince1970: 1619569812)
    update3.lastAccessed = Date(timeIntervalSince1970: 1619569813)
    update4.lastAccessed = Date(timeIntervalSince1970: 1619569814)
    update5.lastAccessed = Date(timeIntervalSince1970: 1619569815)

    // the order of the array shouldn't matter
    let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update5, updates: [update2, update5, update4, update1, update3], filters: nil)
    #expect(updatesToDelete.count == 2)
    #expect(updatesToDelete.contains(update1) == true)
    #expect(updatesToDelete.contains(update2) == true)
  }

  @Test
  func sameLastAccessedDate() {
    // if multiple updates have the same lastAccessed date, should use commitTime to determine
    // which updates to delete
    update1.lastAccessed = Date(timeIntervalSince1970: 1619569810)
    update2.lastAccessed = Date(timeIntervalSince1970: 1619569810)
    update3.lastAccessed = Date(timeIntervalSince1970: 1619569810)
    update4.lastAccessed = Date(timeIntervalSince1970: 1619569810)

    let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update4, updates: [update3, update4, update1, update2], filters: nil)
    #expect(updatesToDelete.count == 1)
    #expect(updatesToDelete.contains(update1) == true)
  }

  @Test
  func launchedUpdateIsOldest() {
    // if the least recently accessed update happens to be launchedUpdate, delete instead the next
    // least recently accessed update
    update1.lastAccessed = Date(timeIntervalSince1970: 1619569811)
    update2.lastAccessed = Date(timeIntervalSince1970: 1619569812)
    update3.lastAccessed = Date(timeIntervalSince1970: 1619569813)
    update4.lastAccessed = Date(timeIntervalSince1970: 1619569814)

    let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update1, updates: [update1, update2, update3, update4], filters: nil)
    #expect(updatesToDelete.count == 1)
    #expect(updatesToDelete.contains(update2) == true)
  }

  @Test
  func belowMaxNumber() {
    // no need to delete any updates if we have <= the max number of updates
    let updatesToDeleteWith2Total = selectionPolicy.updatesToDelete(withLaunchedUpdate: update2, updates: [update1, update2], filters: nil)
    let updatesToDeleteWith3Total = selectionPolicy.updatesToDelete(withLaunchedUpdate: update3, updates: [update1, update2, update3], filters: nil)
    #expect(updatesToDeleteWith2Total.count == 0)
    #expect(updatesToDeleteWith3Total.count == 0)
  }
}
