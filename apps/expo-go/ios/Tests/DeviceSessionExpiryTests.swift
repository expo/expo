// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class DeviceSessionExpiryTests: XCTestCase {
  override func setUp() {
    super.setUp()
    SessionStore.shared.removeAll()
  }

  override func tearDown() {
    SessionStore.shared.removeAll()
    super.tearDown()
  }

  func testNoSessionIsNotExpired() {
    XCTAssertFalse(AuthenticationService.isSessionExpired())
  }

  func testFutureExpiryIsNotExpired() {
    SessionStore.shared.add(sessionSecret: "secret", expiresAt: Date().addingTimeInterval(60))
    XCTAssertFalse(AuthenticationService.isSessionExpired())
  }

  func testPastExpiryIsExpired() {
    SessionStore.shared.add(sessionSecret: "secret", expiresAt: Date().addingTimeInterval(-1))
    XCTAssertTrue(AuthenticationService.isSessionExpired())
  }

  func testNilExpiryIsNeverExpired() {
    SessionStore.shared.add(sessionSecret: "secret")
    XCTAssertFalse(AuthenticationService.isSessionExpired())
  }

  func testDeactivateExpiredSessionKeepsItListed() {
    SessionStore.shared.add(sessionSecret: "secret", expiresAt: Date().addingTimeInterval(-1), username: "test-user")

    AuthenticationService.deactivateExpiredSession()

    XCTAssertFalse(AuthenticationService.isSessionExpired())
    XCTAssertNil(SessionStore.shared.activeSession)
    XCTAssertEqual(SessionStore.shared.sessions.map(\.username), ["test-user"])
  }

  func testDeactivateExpiredSessionPostsSessionDidChange() {
    let expectation = expectation(forNotification: .expoSessionDidChange, object: nil)
    AuthenticationService.deactivateExpiredSession()
    wait(for: [expectation], timeout: 1)
  }

  func testRemovingDeviceLoginGrantsOnlyRemovesThatUser() {
    AuthenticationService.recordDeviceLoginGrant(username: "alan", forVerificationHost: "a.example")
    AuthenticationService.recordDeviceLoginGrant(username: "other", forVerificationHost: "b.example")
    SessionStore.shared.add(sessionSecret: "secret", username: "other")

    AuthenticationService.removeDeviceLoginGrants(forUsername: "alan")

    XCTAssertTrue(AuthenticationService.isDeviceLoginAlreadyGranted(forVerificationHost: "b.example"))
    SessionStore.shared.add(sessionSecret: "secret-2", username: "alan")
    XCTAssertFalse(AuthenticationService.isDeviceLoginAlreadyGranted(forVerificationHost: "a.example"))
    UserDefaults.standard.removeObject(forKey: AuthenticationService.deviceLoginGrantsKey)
  }
}
