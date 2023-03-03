//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class EXUpdatesReaperSelectionPolicyDevelopmentClientSpec : ExpoSpec {
  override func spec() {
    var update1: EXUpdatesUpdate!
    var update2: EXUpdatesUpdate!
    var update3: EXUpdatesUpdate!
    var update4: EXUpdatesUpdate!
    var update5: EXUpdatesUpdate!
    var selectionPolicy: EXUpdatesReaperSelectionPolicy!
    
    beforeEach {
      let runtimeVersion = "1.0"
      let database = EXUpdatesDatabase()
      
      // test updates with different scopes to ensure this policy ignores scopes
      update1 = EXUpdatesUpdate(
        manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
        config: EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: "scope1"
        ]),
        database: database,
        updateId: UUID(),
        scopeKey: "scope1",
        commitTime: Date(timeIntervalSince1970: 1608667851),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: .StatusReady,
        isDevelopmentMode: false,
        assetsFromManifest: []
      )
      update2 = EXUpdatesUpdate(
        manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
        config: EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: "scope2"
        ]),
        database: database,
        updateId: UUID(),
        scopeKey: "scope2",
        commitTime: Date(timeIntervalSince1970: 1608667852),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: .StatusReady,
        isDevelopmentMode: false,
        assetsFromManifest: []
      )
      update3 = EXUpdatesUpdate(
        manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
        config: EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: "scope3"
        ]),
        database: database,
        updateId: UUID(),
        scopeKey: "scope3",
        commitTime: Date(timeIntervalSince1970: 1608667853),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: .StatusReady,
        isDevelopmentMode: false,
        assetsFromManifest: []
      )
      update4 = EXUpdatesUpdate(
        manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
        config: EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: "scope4"
        ]),
        database: database,
        updateId: UUID(),
        scopeKey: "scope4",
        commitTime: Date(timeIntervalSince1970: 1608667854),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: .StatusReady,
        isDevelopmentMode: false,
        assetsFromManifest: []
      )
      update5 = EXUpdatesUpdate(
        manifest: EXManifestsManifestFactory.manifest(forManifestJSON: [:]),
        config: EXUpdatesConfig.config(fromDictionary: [
          EXUpdatesConfig.EXUpdatesConfigScopeKeyKey: "scope5"
        ]),
        database: database,
        updateId: UUID(),
        scopeKey: "scope5",
        commitTime: Date(timeIntervalSince1970: 1608667855),
        runtimeVersion: runtimeVersion,
        keep: true,
        status: .StatusReady,
        isDevelopmentMode: false,
        assetsFromManifest: []
      )
      
      // for readability/writability, test with a policy that keeps only 3 updates;
      // the actual functionality is independent of the number
      selectionPolicy = EXUpdatesReaperSelectionPolicyDevelopmentClient.init(maxUpdatesToKeep: 3)
    }
    
    describe("updates to delete") {
      it("basic case") {
        update1.lastAccessed = Date(timeIntervalSince1970: 1619569811)
        update2.lastAccessed = Date(timeIntervalSince1970: 1619569812)
        update3.lastAccessed = Date(timeIntervalSince1970: 1619569813)
        update4.lastAccessed = Date(timeIntervalSince1970: 1619569814)
        update5.lastAccessed = Date(timeIntervalSince1970: 1619569815)
        
        // the order of the array shouldn't matter
        let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update5, updates: [update2, update5, update4, update1, update3], filters: nil)
        expect(updatesToDelete.count) == 2
        expect(updatesToDelete.contains(update1)) == true
        expect(updatesToDelete.contains(update2)) == true
      }
      
      it("same last accessed date") {
        // if multiple updates have the same lastAccessed date, should use commitTime to determine
        // which updates to delete
        update1.lastAccessed = Date(timeIntervalSince1970: 1619569810)
        update2.lastAccessed = Date(timeIntervalSince1970: 1619569810)
        update3.lastAccessed = Date(timeIntervalSince1970: 1619569810)
        update4.lastAccessed = Date(timeIntervalSince1970: 1619569810)
        
        let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update4, updates: [update3, update4, update1, update2], filters: nil)
        expect(updatesToDelete.count) == 1
        expect(updatesToDelete.contains(update1)) == true
      }
      
      it("launched update is oldest") {
        // if the least recently accessed update happens to be launchedUpdate, delete instead the next
        // least recently accessed update
        update1.lastAccessed = Date(timeIntervalSince1970: 1619569811)
        update2.lastAccessed = Date(timeIntervalSince1970: 1619569812)
        update3.lastAccessed = Date(timeIntervalSince1970: 1619569813)
        update4.lastAccessed = Date(timeIntervalSince1970: 1619569814)
        
        let updatesToDelete = selectionPolicy.updatesToDelete(withLaunchedUpdate: update1, updates: [update1, update2, update3, update4], filters: nil)
        expect(updatesToDelete.count) == 1
        expect(updatesToDelete.contains(update2)) == true
      }
      
      it("below max number") {
        // no need to delete any updates if we have <= the max number of updates
        let updatesToDeleteWith2Total = selectionPolicy.updatesToDelete(withLaunchedUpdate: update2, updates: [update1, update2], filters: nil)
        let updatesToDeleteWith3Total = selectionPolicy.updatesToDelete(withLaunchedUpdate: update3, updates: [update1, update2, update3], filters: nil)
        expect(updatesToDeleteWith2Total.count) == 0
        expect(updatesToDeleteWith3Total.count) == 0
      }
    }
  }
}
