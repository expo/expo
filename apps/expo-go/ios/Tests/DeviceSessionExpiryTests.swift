// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class DeviceSessionExpiryTests: XCTestCase {
  private let defaults = UserDefaults.standard

  override func setUp() {
    super.setUp()
    AuthenticationService.clearSession()
  }

  override func tearDown() {
    AuthenticationService.clearSession()
    super.tearDown()
  }

  func testNoStoredExpiryIsNotExpired() {
    XCTAssertFalse(AuthenticationService.isSessionExpired())
  }

  func testFutureExpiryIsNotExpired() async {
    await AuthenticationService.storeDeviceAuthSession(
      sessionSecret: "secret",
      username: "test-user",
      expiresAt: Date().addingTimeInterval(60)
    )
    XCTAssertFalse(AuthenticationService.isSessionExpired())
    XCTAssertEqual(defaults.string(forKey: AuthenticationService.sessionKey), "secret")
    XCTAssertEqual(defaults.string(forKey: AuthenticationService.usernameKey), "test-user")
  }

  func testPastExpiryIsExpired() async {
    await AuthenticationService.storeDeviceAuthSession(
      sessionSecret: "secret",
      username: "test-user",
      expiresAt: Date().addingTimeInterval(-1)
    )
    XCTAssertTrue(AuthenticationService.isSessionExpired())
  }

  func testNilExpiryIsNeverExpired() async {
    await AuthenticationService.storeDeviceAuthSession(
      sessionSecret: "secret",
      username: "test-user",
      expiresAt: nil
    )
    XCTAssertFalse(AuthenticationService.isSessionExpired())
    XCTAssertNil(defaults.object(forKey: AuthenticationService.sessionExpiresAtKey))
  }

  func testClearSessionRemovesEveryKey() async {
    await AuthenticationService.storeDeviceAuthSession(
      sessionSecret: "secret",
      username: "test-user",
      expiresAt: Date().addingTimeInterval(60)
    )
    defaults.set("acc1", forKey: AuthenticationService.selectedAccountKey)

    AuthenticationService.clearSession()

    XCTAssertNil(defaults.string(forKey: AuthenticationService.sessionKey))
    XCTAssertNil(defaults.string(forKey: AuthenticationService.usernameKey))
    XCTAssertNil(defaults.string(forKey: AuthenticationService.selectedAccountKey))
    XCTAssertNil(defaults.object(forKey: AuthenticationService.sessionExpiresAtKey))
  }

  func testStoringPostsSessionDidChange() async {
    let expectation = expectation(forNotification: .expoSessionDidChange, object: nil)
    await AuthenticationService.storeDeviceAuthSession(
      sessionSecret: "secret",
      username: "test-user",
      expiresAt: Date().addingTimeInterval(60)
    )
    await fulfillment(of: [expectation], timeout: 1)
  }
}
