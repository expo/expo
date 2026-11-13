// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class ExpoGoHomeBridgeAuthTests: XCTestCase {
  override func setUp() {
    super.setUp()
    SessionStore.shared.removeAll()
  }

  override func tearDown() {
    SessionStore.shared.removeAll()
    super.tearDown()
  }

  func testNoSessionIsNotAuthenticated() {
    XCTAssertFalse(ExpoGoHomeBridge.shared.isAuthenticated())
    XCTAssertNil(ExpoGoHomeBridge.shared.authenticatedUsername())
    XCTAssertNil(ExpoGoHomeBridge.shared.sessionExpiredMessage())
  }

  func testLiveSessionReportsUsername() {
    SessionStore.shared.add(sessionSecret: "secret", expiresAt: Date().addingTimeInterval(60), username: "test-user")

    XCTAssertTrue(ExpoGoHomeBridge.shared.isAuthenticated())
    XCTAssertEqual(ExpoGoHomeBridge.shared.authenticatedUsername(), "test-user")
    XCTAssertNil(ExpoGoHomeBridge.shared.sessionExpiredMessage())
  }

  func testExpiredSessionReportsNeitherAuthNorUsername() {
    SessionStore.shared.add(sessionSecret: "secret", expiresAt: Date().addingTimeInterval(-1), username: "test-user")

    XCTAssertFalse(ExpoGoHomeBridge.shared.isAuthenticated())
    XCTAssertNil(ExpoGoHomeBridge.shared.authenticatedUsername())
    XCTAssertEqual(ExpoGoHomeBridge.shared.sessionExpiredMessage(), ExpoGoHomeBridge.expiredSessionMessage)
  }

  func testSessionWithoutExpiryReportsUsername() {
    SessionStore.shared.add(sessionSecret: "secret", username: "test-user")

    XCTAssertTrue(ExpoGoHomeBridge.shared.isAuthenticated())
    XCTAssertEqual(ExpoGoHomeBridge.shared.authenticatedUsername(), "test-user")
  }

  func testUsernameFollowsTheActiveSession() {
    let first = SessionStore.shared.add(sessionSecret: "a", username: "first-user")
    SessionStore.shared.add(sessionSecret: "b", username: "second-user")

    SessionStore.shared.activate(id: first.id)

    XCTAssertEqual(ExpoGoHomeBridge.shared.authenticatedUsername(), "first-user")
  }
}
