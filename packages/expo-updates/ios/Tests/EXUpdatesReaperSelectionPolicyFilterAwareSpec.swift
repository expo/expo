//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class EXUpdatesReaperSelectionPolicyFilterAwareSpec : ExpoSpec {
  override func spec() {
    var config: EXUpdatesConfig!
    var database: EXUpdatesDatabase!
    var update1: EXUpdatesUpdate!
    var update2: EXUpdatesUpdate!
    var update3: EXUpdatesUpdate!
    var update4: EXUpdatesUpdate!
    var update5: EXUpdatesUpdate!
    var selectionPolicy: EXUpdatesReaperSelectionPolicy!
    
    beforeEach {
      let runtimeVersion = "1.0"
      let scopeKey = "dummyScope"
      config = EXUpdatesConfig.config(fromDictionary: [
        EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: "scope1"
      ])
      database = EXUpdatesDatabase()
      update1 = EXUpdatesUpdate(
        manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
        config: config,
        database: database,
        updateId: UUID(),
        scopeKey: scopeKey,
        commitTime: Date(timeIntervalSince1970: 1608667851),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: .StatusReady,
        isDevelopmentMode: false,
        assetsFromManifest: []
      )
      update2 = EXUpdatesUpdate(
        manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
        config: config,
        database: database,
        updateId: UUID(),
        scopeKey: scopeKey,
        commitTime: Date(timeIntervalSince1970: 1608667852),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: .StatusReady,
        isDevelopmentMode: false,
        assetsFromManifest: []
      )
      update3 = EXUpdatesUpdate(
        manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
        config: config,
        database: database,
        updateId: UUID(),
        scopeKey: scopeKey,
        commitTime: Date(timeIntervalSince1970: 1608667853),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: .StatusReady,
        isDevelopmentMode: false,
        assetsFromManifest: []
      )
      update4 = EXUpdatesUpdate(
        manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
        config: config,
        database: database,
        updateId: UUID(),
        scopeKey: scopeKey,
        commitTime: Date(timeIntervalSince1970: 1608667854),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: .StatusReady,
        isDevelopmentMode: false,
        assetsFromManifest: []
      )
      update5 = EXUpdatesUpdate(
        manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
        config: config,
        database: database,
        updateId: UUID(),
        scopeKey: scopeKey,
        commitTime: Date(timeIntervalSince1970: 1608667855),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: .StatusReady,
        isDevelopmentMode: false,
        assetsFromManifest: []
      )
      
      selectionPolicy = EXUpdatesReaperSelectionPolicyFilterAware()
    }
    
    describe("selection") {
      it("updates to delete - only one update") {
        expect(selectionPolicy.updatesToDelete(withLaunchedUpdate: update1, updates: [update1], filters: nil).count) == 0
      }
      
      it("updates to delete - older updates") {
        let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update3, updates: [update1, update2, update3], filters: nil)
        expect(updatesToDelete.count) == 1
        expect(updatesToDelete.contains(update1)) == true
        expect(updatesToDelete.contains(update2)) == false
        expect(updatesToDelete.contains(update3)) == false
      }
      
      it("updates to delete - newer updates") {
        let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update1, updates: [update1, update2], filters: nil)
        expect(updatesToDelete.count) == 0
      }
      
      it("updates to delete - older and newer updates") {
        let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update4, updates: [update1, update2, update3, update4, update5], filters: nil)
        expect(updatesToDelete.count) == 2
        expect(updatesToDelete.contains(update1)) == true
        expect(updatesToDelete.contains(update2)) == true
      }
      
      it("updates to delete - different scope key") {
        let configDifferentScope = EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: "differentScopeKey"
        ])
        let update4DifferentScope = EXUpdatesUpdate(
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
          assetsFromManifest: []
        )
        
        let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update4DifferentScope, updates: [update1, update2, update3, update4DifferentScope], filters: nil)
        expect(updatesToDelete.count) == 0
      }

    }
  }
}
