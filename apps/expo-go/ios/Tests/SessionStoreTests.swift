// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class SessionStoreTests: XCTestCase {
  private var keychain: InMemoryKeychain!
  private var store: SessionStore!

  override func setUp() {
    super.setUp()
    keychain = InMemoryKeychain()
    store = SessionStore(keychain: keychain)
  }

  func testAddMakesTheNewSessionActive() {
    store.add(sessionSecret: "a")
    let second = store.add(sessionSecret: "b")

    XCTAssertEqual(store.sessions.map(\.sessionSecret), ["a", "b"])
    XCTAssertEqual(store.activeSession?.id, second.id)
    XCTAssertEqual(store.activeLiveSession?.sessionSecret, "b")
  }

  func testSessionsPersistAcrossInstances() {
    let session = store.add(sessionSecret: "a", username: "alan")

    let reloaded = SessionStore(keychain: keychain)

    XCTAssertEqual(reloaded.sessions, [session])
    XCTAssertEqual(reloaded.activeSession?.id, session.id)
  }

  func testCorruptKeychainDataGivesAnEmptyStore() {
    keychain.data = Data("not json".utf8)

    let reloaded = SessionStore(keychain: keychain)

    XCTAssertTrue(reloaded.sessions.isEmpty)
    XCTAssertNil(reloaded.activeSession)
  }

  func testUndecodableAccountsKeepTheSession() throws {
    keychain.data = Data("""
    {"sessions":[{"id":"s1","actorType":"user","sessionSecret":"secret","accounts":[{"unexpected":true}]}],
     "activeSessionId":"s1"}
    """.utf8)

    let reloaded = SessionStore(keychain: keychain)

    let session = try XCTUnwrap(reloaded.activeSession)
    XCTAssertEqual(session.sessionSecret, "secret")
    XCTAssertTrue(session.accounts.isEmpty)
  }

  func testFallBackFromExpiredActiveSessionWhenALiveSessionExists() {
    let live = store.add(sessionSecret: "live")
    store.add(sessionSecret: "expired", expiresAt: Date().addingTimeInterval(-1))

    store.fallBackFromExpiredActiveSession()

    XCTAssertEqual(store.activeSession?.id, live.id)
  }

  func testFallBackKeepsTheExpiredActiveSessionWhenNoLiveSessionExists() {
    let expired = store.add(sessionSecret: "expired", expiresAt: Date().addingTimeInterval(-1))

    store.fallBackFromExpiredActiveSession()

    XCTAssertEqual(store.activeSession?.id, expired.id)
  }

  func testExpiredActiveSessionIsNotLive() {
    store.add(sessionSecret: "a", expiresAt: Date().addingTimeInterval(-1))

    XCTAssertNotNil(store.activeSession)
    XCTAssertNil(store.activeLiveSession)
  }

  func testRemoveActiveFallsBackToFirstLiveSession() {
    let first = store.add(sessionSecret: "a")
    let second = store.add(sessionSecret: "b")

    store.remove(id: second.id)

    XCTAssertEqual(store.activeSession?.id, first.id)
  }

  func testRemoveActiveSkipsExpiredSessions() {
    store.add(sessionSecret: "expired", expiresAt: Date().addingTimeInterval(-1))
    let live = store.add(sessionSecret: "live")

    store.remove(id: live.id)

    XCTAssertNil(store.activeSession)
    XCTAssertEqual(store.sessions.map(\.sessionSecret), ["expired"])
  }

  func testRemoveNonActiveKeepsTheActiveSession() {
    let first = store.add(sessionSecret: "a")
    let second = store.add(sessionSecret: "b")

    store.remove(id: first.id)

    XCTAssertEqual(store.activeSession?.id, second.id)
  }

  func testRemovingTheLastSessionClearsTheKeychain() {
    let session = store.add(sessionSecret: "a")

    store.remove(id: session.id)

    XCTAssertNil(store.activeSession)
    XCTAssertNil(keychain.data)
  }

  func testDeactivateExpiredActiveSessionKeepsItListed() {
    let live = store.add(sessionSecret: "live")
    let expired = store.add(sessionSecret: "expired", expiresAt: Date().addingTimeInterval(-1))

    store.deactivateExpiredActiveSession()

    XCTAssertEqual(store.activeSession?.id, live.id)
    XCTAssertTrue(store.sessions.contains { $0.id == expired.id })
  }

  func testDeactivateDoesNothingForALiveSession() {
    let live = store.add(sessionSecret: "live")

    store.deactivateExpiredActiveSession()

    XCTAssertEqual(store.activeSession?.id, live.id)
  }

  func testUpdateProfileFillsFieldsAndSelectsTheFirstAccount() throws {
    let session = store.add(sessionSecret: "a")
    let accounts = [makeAccount(id: "acc-1", name: "alan", ownerId: "user-1"), makeAccount(id: "acc-2", name: "expo", ownerId: nil)]

    store.updateProfile(id: session.id, from: makeActor(id: "user-1", username: "alan", fullName: "Alan Hughes", accounts: accounts))

    let updated = try XCTUnwrap(store.activeSession)
    XCTAssertEqual(updated.userId, "user-1")
    XCTAssertEqual(updated.username, "alan")
    XCTAssertEqual(updated.displayName, "Alan Hughes")
    XCTAssertEqual(updated.actorType, .user)
    XCTAssertEqual(updated.accounts, accounts)
    XCTAssertEqual(updated.selectedAccountId, "acc-1")
  }

  func testUpdateProfileKeepsAValidSelectedAccount() {
    let session = store.add(sessionSecret: "a", selectedAccountId: "acc-2")
    let accounts = [makeAccount(id: "acc-1", name: "alan", ownerId: "user-1"), makeAccount(id: "acc-2", name: "expo", ownerId: nil)]

    store.updateProfile(id: session.id, from: makeActor(id: "user-1", username: "alan", accounts: accounts))

    XCTAssertEqual(store.activeSession?.selectedAccountId, "acc-2")
  }

  func testUpdateProfileMarksAPartnerActor() {
    let session = store.add(sessionSecret: "a")

    store.updateProfile(
      id: session.id,
      from: makeActor(typename: "PartnerActor", id: "partner-1", username: "partner-user", accounts: [])
    )

    XCTAssertEqual(store.activeSession?.actorType, .partner)
  }

  func testUpdateProfileReplacesOlderSessionOfSameUser() {
    let older = store.add(sessionSecret: "old")
    store.updateProfile(id: older.id, from: makeActor(id: "user-1", username: "alan", accounts: []))
    let newer = store.add(sessionSecret: "new")

    store.updateProfile(id: newer.id, from: makeActor(id: "user-1", username: "alan", accounts: []))

    XCTAssertEqual(store.sessions.map(\.id), [newer.id])
    XCTAssertEqual(store.activeSession?.sessionSecret, "new")
  }

  func testSelectAccountOnlyChangesThatSession() {
    let first = store.add(sessionSecret: "a", selectedAccountId: "acc-1")
    let second = store.add(sessionSecret: "b", selectedAccountId: "acc-9")

    store.selectAccount("acc-2", forSession: first.id)

    XCTAssertEqual(store.sessions.first { $0.id == first.id }?.selectedAccountId, "acc-2")
    XCTAssertEqual(store.sessions.first { $0.id == second.id }?.selectedAccountId, "acc-9")
  }

  func testActivateIgnoresUnknownIds() {
    let session = store.add(sessionSecret: "a")

    store.activate(id: "missing")

    XCTAssertEqual(store.activeSession?.id, session.id)
  }
}
