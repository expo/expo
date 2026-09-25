// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class BrowserLoginSessionTests: XCTestCase {
  func testFirstSignInSharesTheBrowserSession() {
    XCTAssertFalse(AuthenticationService.usesEphemeralBrowserSession(storedSessions: []))
  }

  func testAddingAnAccountUsesAnEphemeralBrowserSession() {
    XCTAssertTrue(AuthenticationService.usesEphemeralBrowserSession(storedSessions: [makeSession(id: "s1")]))
  }

  func testAnInactiveStoredSessionStillNeedsAnEphemeralBrowserSession() {
    let expired = makeSession(id: "s1", expiresAt: Date().addingTimeInterval(-1))

    XCTAssertTrue(AuthenticationService.usesEphemeralBrowserSession(storedSessions: [expired]))
  }
}
