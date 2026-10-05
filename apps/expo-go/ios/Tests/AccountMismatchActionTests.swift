// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class AccountMismatchActionTests: XCTestCase {
  func testLiveStoredSessionIsSwitchedTo() {
    let sessions = [makeSession(id: "a", username: "yvonne"), makeSession(id: "b", username: "xavier")]

    XCTAssertEqual(
      AccountMismatchAction.resolve(username: "xavier", sessions: sessions, activeSessionId: "a"),
      .switchTo(sessionId: "b")
    )
  }

  func testMissingSessionNeedsSignIn() {
    let sessions = [makeSession(id: "a", username: "yvonne")]

    XCTAssertEqual(AccountMismatchAction.resolve(username: "xavier", sessions: sessions, activeSessionId: "a"), .signIn)
  }

  func testExpiredSessionNeedsSignIn() {
    let sessions = [
      makeSession(id: "a", username: "yvonne"),
      makeSession(id: "b", username: "xavier", expiresAt: Date().addingTimeInterval(-1))
    ]

    XCTAssertEqual(AccountMismatchAction.resolve(username: "xavier", sessions: sessions, activeSessionId: "a"), .signIn)
  }

  func testActiveSessionOfTheOwnerHasNoAction() {
    let sessions = [makeSession(id: "b", username: "xavier")]

    XCTAssertNil(AccountMismatchAction.resolve(username: "xavier", sessions: sessions, activeSessionId: "b"))
  }

  func testUsernameMatchIsExact() {
    let sessions = [makeSession(id: "b", username: "Xavier")]

    XCTAssertEqual(AccountMismatchAction.resolve(username: "xavier", sessions: sessions, activeSessionId: nil), .signIn)
  }

  func testLiveSessionOfAnotherUserStillNeedsSignIn() {
    let sessions = [makeSession(id: "a", username: "yvonne")]

    XCTAssertEqual(AccountMismatchAction.resolve(username: "xavier", sessions: sessions, activeSessionId: nil), .signIn)
  }

  func testTitles() {
    XCTAssertEqual(AccountMismatchAction.switchTo(sessionId: "b").title(for: "xavier"), "Switch to xavier")
    XCTAssertEqual(AccountMismatchAction.signIn.title(for: "xavier"), "Sign in as xavier")
  }
}
