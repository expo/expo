//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

@Suite("ReaperSelectionPolicyFilterAware selection")
struct ReaperSelectionPolicyFilterAwareTests {
  let config: UpdatesConfig
  let database: UpdatesDatabase
  let update1: Update
  let update2: Update
  let update3: Update
  let update4: Update
  let update5: Update
  let selectionPolicy: ReaperSelectionPolicy

  init() {
    let runtimeVersion = "1.0"
    let scopeKey = "dummyScope"
    config = try! UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "scope1",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    database = UpdatesDatabase()
    update1 = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: database,
      updateId: UUID(),
      scopeKey: scopeKey,
      commitTime: Date(timeIntervalSince1970: 1608667851),
      runtimeVersion: runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: URL(string: "https://example.com"),
      requestHeaders: [:]
    )
    update2 = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: database,
      updateId: UUID(),
      scopeKey: scopeKey,
      commitTime: Date(timeIntervalSince1970: 1608667852),
      runtimeVersion: runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: URL(string: "https://example.com"),
      requestHeaders: [:]
    )
    update3 = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: database,
      updateId: UUID(),
      scopeKey: scopeKey,
      commitTime: Date(timeIntervalSince1970: 1608667853),
      runtimeVersion: runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: URL(string: "https://example.com"),
      requestHeaders: [:]
    )
    update4 = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: database,
      updateId: UUID(),
      scopeKey: scopeKey,
      commitTime: Date(timeIntervalSince1970: 1608667854),
      runtimeVersion: runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: URL(string: "https://example.com"),
      requestHeaders: [:]
    )
    update5 = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: database,
      updateId: UUID(),
      scopeKey: scopeKey,
      commitTime: Date(timeIntervalSince1970: 1608667855),
      runtimeVersion: runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: URL(string: "https://example.com"),
      requestHeaders: [:]
    )

    selectionPolicy = ReaperSelectionPolicyFilterAware()
  }

  @Test
  func `updates to delete - only one update`() {
    #expect(selectionPolicy.updatesToDelete(withLaunchedUpdate: update1, updates: [update1], filters: nil).count == 0)
  }

  @Test
  func `updates to delete - older updates`() {
    let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update3, updates: [update1, update2, update3], filters: nil)
    #expect(updatesToDelete.count == 1)
    #expect(updatesToDelete.contains(update1) == true)
    #expect(updatesToDelete.contains(update2) == false)
    #expect(updatesToDelete.contains(update3) == false)
  }

  @Test
  func `updates to delete - newer updates`() {
    let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update1, updates: [update1, update2], filters: nil)
    #expect(updatesToDelete.count == 0)
  }

  @Test
  func `updates to delete - older and newer updates`() {
    let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update4, updates: [update1, update2, update3, update4, update5], filters: nil)
    #expect(updatesToDelete.count == 2)
    #expect(updatesToDelete.contains(update1) == true)
    #expect(updatesToDelete.contains(update2) == true)
  }

  @Test
  func `updates to delete - different scope key`() {
    let configDifferentScope = try! UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "differentScopeKey",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let update4DifferentScope = Update(
      manifest: update4.manifest,
      config: configDifferentScope,
      database: database,
      updateId: update4.updateId,
      scopeKey: "differentScopeKey",
      commitTime: update4.commitTime,
      runtimeVersion: update4.runtimeVersion,
      keep: true,
      status: update4.status,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: URL(string: "https://example.com"),
      requestHeaders: [:]
    )

    let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update4DifferentScope, updates: [update1, update2, update3, update4DifferentScope], filters: nil)
    #expect(updatesToDelete.count == 0)
  }

  @Test
  func `should keep configured max updates when older updates exist`() {
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

    #expect(updatesToDelete.count == 1)
    #expect(updatesToDelete.contains(update1) == true)
    #expect(updatesToDelete.contains(update2) == false)
    #expect(updatesToDelete.contains(update3) == false)
    #expect(updatesToDelete.contains(launchedUpdate) == false)
  }

  @Test
  func `should prefer older updates matching manifest filters`() {
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

    #expect(updatesToDelete.count == 2)
    #expect(updatesToDelete.contains(oldestMatchingUpdate) == false)
    #expect(updatesToDelete.contains(olderDefaultUpdate) == true)
    #expect(updatesToDelete.contains(nextNewestMatchingUpdate) == false)
    #expect(updatesToDelete.contains(newestDefaultUpdate) == true)
    #expect(updatesToDelete.contains(launchedUpdate) == false)
  }

  @Test
  func `should retain newest matching updates when matches exceed retention slots`() {
    let matchingUpdates = (1...3).map { createUpdate(commitTime: TimeInterval($0), branchName: "rollout") }
    let nonmatchingUpdate = createUpdate(commitTime: 4, branchName: "default")
    let launchedUpdate = createUpdate(commitTime: 5, branchName: "rollout")
    let policy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: 3)
    let deleted = policy.updatesToDelete(
      withLaunchedUpdate: launchedUpdate,
      updates: [matchingUpdates[2], nonmatchingUpdate, matchingUpdates[0], launchedUpdate, matchingUpdates[1]],
      filters: ["branchname": "rollout"]
    )
    #expect(deleted == [nonmatchingUpdate, matchingUpdates[0]])
  }

  @Test
  func `should fill remaining retained slots with newest older updates`() {
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

    #expect(updatesToDelete.count == 1)
    #expect(updatesToDelete.contains(matchingUpdate) == false)
    #expect(updatesToDelete.contains(olderDefaultUpdate) == true)
    #expect(updatesToDelete.contains(newerDefaultUpdate) == false)
    #expect(updatesToDelete.contains(launchedUpdate) == false)
  }

  @Test
  func `should not delete embedded updates`() {
    let embeddedUpdate = createUpdate(commitTime: 1608667851, status: .StatusEmbedded)
    let olderUpdate = createUpdate(commitTime: 1608667852)
    let launchedUpdate = createUpdate(commitTime: 1608667853)
    let selectionPolicy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: 2, embeddedUpdateId: embeddedUpdate.updateId)

    let updatesToDelete = selectionPolicy.updatesToDelete(
      withLaunchedUpdate: launchedUpdate,
      updates: [embeddedUpdate, olderUpdate, launchedUpdate],
      filters: nil
    )

    #expect(updatesToDelete.count == 0)
  }

  @Test(arguments: [2, 3, 10, Int.max])
  func `should retain newest older updates regardless of input order`(limit: Int) {
    let updates = [update3, update1, update5, update2, update4]
    let policy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: limit)
    let deleted = policy.updatesToDelete(withLaunchedUpdate: update5, updates: updates, filters: nil)
    let expected = [update1, update2, update3, update4].prefix(max(0, 5 - limit))
    #expect(Set(deleted) == Set(expected))
  }

  @Test
  func `should retain newest nonmatching updates when no filters match`() {
    let updates = (1...5).map { createUpdate(commitTime: TimeInterval($0), branchName: "default") }
    let policy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: 3)
    let deleted = policy.updatesToDelete(
      withLaunchedUpdate: updates[4],
      updates: [updates[3], updates[1], updates[4], updates[0], updates[2]],
      filters: ["branchname": "missing"]
    )
    #expect(deleted == [updates[1], updates[0]])
  }

  @Test
  func `should preserve equal commit times and other scopes with configured retention`() {
    let equalTimeUpdate = createUpdate(commitTime: update5.commitTime.timeIntervalSince1970)
    let otherScopeUpdate = createUpdate(commitTime: 1608667850, scopeKey: "other")
    let policy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: 3)
    let deleted = policy.updatesToDelete(
      withLaunchedUpdate: update5,
      updates: [otherScopeUpdate, update4, equalTimeUpdate, update2, update5, update1, update3],
      filters: nil
    )
    #expect(deleted == [update2, update1])
  }

  @Test
  func `embedded updates count toward retained slots`() {
    let embeddedUpdate = createUpdate(commitTime: 1608667854, status: .StatusEmbedded)
    let policy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: 3, embeddedUpdateId: embeddedUpdate.updateId)
    let deleted = policy.updatesToDelete(
      withLaunchedUpdate: update5,
      updates: [update1, update2, update3, embeddedUpdate, update5],
      filters: nil
    )
    #expect(deleted == [update1, update2])
  }

  @Test
  func `stale embedded updates do not consume fallback slots`() {
    let staleEmbedded = createUpdate(commitTime: 1608667854, status: .StatusEmbedded)
    let policy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: 2)
    let deleted = policy.updatesToDelete(
      withLaunchedUpdate: update5,
      updates: [update1, update3, staleEmbedded, update5],
      filters: nil
    )
    #expect(Set(deleted) == Set([update1, staleEmbedded]))
  }

  @Test
  func `current embedded id is protected even when its status is ready`() {
    let policy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep: 2, embeddedUpdateId: update1.updateId)
    let deleted = policy.updatesToDelete(withLaunchedUpdate: update5, updates: [update1, update2, update3, update5], filters: nil)
    #expect(deleted == [update2])
  }

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
      runtimeVersion: "1.0",
      keep: true,
      status: status,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: URL(string: "https://example.com"),
      requestHeaders: [:]
    )
  }

}
