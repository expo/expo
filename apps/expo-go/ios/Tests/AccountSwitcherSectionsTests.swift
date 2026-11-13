// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class AccountSwitcherSectionsTests: XCTestCase {
  private let alanAccounts = [
    makeAccount(id: "org-expo", name: "expo", ownerId: nil),
    makeAccount(id: "acc-alan", name: "alan", ownerId: "user-alan")
  ]

  func testActiveSessionComesFirst() {
    let sessions = [
      makeSession(id: "s1", userId: "user-other", username: "other"),
      makeSession(id: "s2", userId: "user-alan", username: "alan")
    ]

    let sections = AccountSwitcherSections.make(sessions: sessions, activeSessionId: "s2")

    XCTAssertEqual(sections.map(\.sessionId), ["s2", "s1"])
    XCTAssertEqual(sections.map(\.isActive), [true, false])
  }

  func testPersonalAccountComesFirstInEachSection() {
    let sessions = [makeSession(id: "s1", userId: "user-alan", username: "alan", accounts: alanAccounts)]

    let rows = AccountSwitcherSections.make(sessions: sessions, activeSessionId: "s1")[0].rows

    XCTAssertEqual(rows.map(\.account.id), ["acc-alan", "org-expo"])
  }

  func testOnlyTheActiveSessionShowsASelection() {
    let sessions = [
      makeSession(id: "s1", userId: "user-alan", username: "alan", selectedAccountId: "org-expo", accounts: alanAccounts),
      makeSession(id: "s2", userId: "user-other", username: "other", selectedAccountId: "acc-other",
                  accounts: [makeAccount(id: "acc-other", name: "other", ownerId: "user-other")])
    ]

    let sections = AccountSwitcherSections.make(sessions: sessions, activeSessionId: "s1")

    XCTAssertEqual(sections[0].rows.filter(\.isSelected).map(\.account.id), ["org-expo"])
    XCTAssertTrue(sections[1].rows.allSatisfy { !$0.isSelected })
  }

  func testSameOrganizationAppearsOncePerUser() {
    let expo = makeAccount(id: "org-expo", name: "expo", ownerId: nil)
    let sessions = [
      makeSession(id: "s1", userId: "user-alan", username: "alan", accounts: [expo]),
      makeSession(id: "s2", userId: "user-other", username: "other", accounts: [expo])
    ]

    let sections = AccountSwitcherSections.make(sessions: sessions, activeSessionId: "s1")

    XCTAssertEqual(sections.flatMap(\.rows).map(\.id), ["s1/org-expo", "s2/org-expo"])
  }

  func testExpiredSessionHasNoRows() {
    let sessions = [
      makeSession(id: "s1", userId: "user-alan", username: "alan", expiresAt: Date().addingTimeInterval(-1), accounts: alanAccounts)
    ]

    let section = AccountSwitcherSections.make(sessions: sessions, activeSessionId: nil)[0]

    XCTAssertTrue(section.isExpired)
    XCTAssertTrue(section.rows.isEmpty)
    XCTAssertEqual(section.username, "alan")
  }

  func testPartnerSessionIsFlagged() {
    let sessions = [makeSession(id: "s1", userId: "partner-1", username: "partner-user", actorType: .partner)]

    XCTAssertTrue(AccountSwitcherSections.make(sessions: sessions, activeSessionId: "s1")[0].isPartner)
  }
}
