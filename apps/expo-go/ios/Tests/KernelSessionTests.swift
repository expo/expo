// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class KernelSessionTests: XCTestCase {
  override func setUp() {
    super.setUp()
    SessionStore.shared.removeAll()
  }

  override func tearDown() {
    SessionStore.shared.removeAll()
    super.tearDown()
  }

  func testSignedOutHasNoSecret() {
    XCTAssertNil(Session.sharedInstance.sessionSecret())
  }

  func testReturnsTheActiveSessionSecret() {
    let first = SessionStore.shared.add(sessionSecret: "first")
    SessionStore.shared.add(sessionSecret: "second")
    XCTAssertEqual(Session.sharedInstance.sessionSecret(), "second")

    SessionStore.shared.activate(id: first.id)
    XCTAssertEqual(Session.sharedInstance.sessionSecret(), "first")
  }

  func testOmitsAnExpiredSession() {
    SessionStore.shared.add(sessionSecret: "expired", expiresAt: Date().addingTimeInterval(-1))
    XCTAssertNil(Session.sharedInstance.sessionSecret())
  }
}
