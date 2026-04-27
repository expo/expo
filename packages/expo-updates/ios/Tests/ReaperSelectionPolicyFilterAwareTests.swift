//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

@Suite("ReaperSelectionPolicyFilterAware", .serialized)
@MainActor
struct ReaperSelectionPolicyFilterAwareTests {
  var config: UpdatesConfig
  var update1: Update
  var update2: Update
  var update3: Update
  var update4: Update
  var update5: Update
  var selectionPolicy: ReaperSelectionPolicy

  init() throws {
    let runtimeVersion = "1.0"
    let scopeKey = "dummyScope"
    let database = UpdatesDatabase()

    config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "scope1",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
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
  func updatesToDeleteOnlyOneUpdate() {
    #expect(selectionPolicy.updatesToDelete(withLaunchedUpdate: update1, updates: [update1], filters: nil).count == 0)
  }

  @Test
  func updatesToDeleteOlderUpdates() {
    let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update3, updates: [update1, update2, update3], filters: nil)
    #expect(updatesToDelete.count == 1)
    #expect(updatesToDelete.contains(update1) == true)
    #expect(updatesToDelete.contains(update2) == false)
    #expect(updatesToDelete.contains(update3) == false)
  }

  @Test
  func updatesToDeleteNewerUpdates() {
    let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update1, updates: [update1, update2], filters: nil)
    #expect(updatesToDelete.count == 0)
  }

  @Test
  func updatesToDeleteOlderAndNewerUpdates() {
    let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update4, updates: [update1, update2, update3, update4, update5], filters: nil)
    #expect(updatesToDelete.count == 2)
    #expect(updatesToDelete.contains(update1) == true)
    #expect(updatesToDelete.contains(update2) == true)
  }

  @Test
  func updatesToDeleteDifferentScopeKey() throws {
    let configDifferentScope = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "differentScopeKey",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let database = UpdatesDatabase()
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
}
