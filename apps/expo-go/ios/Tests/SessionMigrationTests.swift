// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class SessionMigrationTests: XCTestCase {
  private let suiteName = "SessionMigrationTests"
  private var defaults: UserDefaults!
  private var legacyKeychain: InMemoryKeychain!
  private var store: SessionStore!

  override func setUp() {
    super.setUp()
    UserDefaults().removePersistentDomain(forName: suiteName)
    defaults = UserDefaults(suiteName: suiteName)
    legacyKeychain = InMemoryKeychain()
    store = SessionStore(keychain: InMemoryKeychain())
  }

  override func tearDown() {
    UserDefaults().removePersistentDomain(forName: suiteName)
    super.tearDown()
  }

  private func migrate() {
    SessionMigration.migrateIfNeeded(into: store, legacyKeychain: legacyKeychain, defaults: defaults)
  }

  func testMigratesTheUserDefaultsSession() {
    defaults.set("secret", forKey: SessionMigration.legacySessionKey)
    defaults.set("alan", forKey: SessionMigration.legacyUsernameKey)
    defaults.set("acc-1", forKey: SessionMigration.legacySelectedAccountKey)

    migrate()

    let session = store.activeSession
    XCTAssertEqual(session?.sessionSecret, "secret")
    XCTAssertEqual(session?.username, "alan")
    XCTAssertEqual(session?.selectedAccountId, "acc-1")
    XCTAssertNil(session?.expiresAt)
  }

  func testMigratesExpiryFromUserDefaults() throws {
    let expiresAt = Date().addingTimeInterval(-60)
    defaults.set("secret", forKey: SessionMigration.legacySessionKey)
    defaults.set(expiresAt.timeIntervalSince1970, forKey: SessionMigration.legacyExpiresAtKey)

    migrate()

    let migrated = try XCTUnwrap(store.activeSession?.expiresAt)
    XCTAssertEqual(migrated.timeIntervalSince1970, expiresAt.timeIntervalSince1970, accuracy: 0.001)
    XCTAssertNil(store.activeLiveSession)
  }

  func testMigratesAKeychainOnlySession() {
    legacyKeychain.data = try? JSONSerialization.data(withJSONObject: ["sessionSecret": "keychain-secret"])

    migrate()

    XCTAssertEqual(store.activeSession?.sessionSecret, "keychain-secret")
  }

  func testRemovesEveryLegacyKey() {
    defaults.set("secret", forKey: SessionMigration.legacySessionKey)
    defaults.set("alan", forKey: SessionMigration.legacyUsernameKey)
    defaults.set("acc-1", forKey: SessionMigration.legacySelectedAccountKey)
    defaults.set(1.0, forKey: SessionMigration.legacyExpiresAtKey)
    legacyKeychain.data = Data("{}".utf8)

    migrate()

    XCTAssertNil(defaults.object(forKey: SessionMigration.legacySessionKey))
    XCTAssertNil(defaults.object(forKey: SessionMigration.legacyUsernameKey))
    XCTAssertNil(defaults.object(forKey: SessionMigration.legacySelectedAccountKey))
    XCTAssertNil(defaults.object(forKey: SessionMigration.legacyExpiresAtKey))
    XCTAssertNil(legacyKeychain.data)
  }

  func testNoLegacySessionLeavesTheStoreEmpty() {
    migrate()

    XCTAssertTrue(store.sessions.isEmpty)
  }

  func testDoesNotAddWhenTheStoreAlreadyHasSessions() {
    store.add(sessionSecret: "current")
    defaults.set("stale", forKey: SessionMigration.legacySessionKey)

    migrate()

    XCTAssertEqual(store.sessions.map(\.sessionSecret), ["current"])
    XCTAssertNil(defaults.object(forKey: SessionMigration.legacySessionKey))
  }
}
