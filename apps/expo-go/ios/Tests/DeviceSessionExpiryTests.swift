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

  func testFutureExpiryIsNotExpired() {
    defaults.set(Date().addingTimeInterval(60).timeIntervalSince1970, forKey: AuthenticationService.sessionExpiresAtKey)
    XCTAssertFalse(AuthenticationService.isSessionExpired())
  }

  func testPastExpiryIsExpired() {
    defaults.set(Date().addingTimeInterval(-1).timeIntervalSince1970, forKey: AuthenticationService.sessionExpiresAtKey)
    XCTAssertTrue(AuthenticationService.isSessionExpired())
  }

  func testNilExpiryIsNeverExpired() {
    defaults.removeObject(forKey: AuthenticationService.sessionExpiresAtKey)
    XCTAssertFalse(AuthenticationService.isSessionExpired())
  }

  func testClearSessionRemovesEveryKey() {
    defaults.set("secret", forKey: AuthenticationService.sessionKey)
    defaults.set("test-user", forKey: AuthenticationService.usernameKey)
    defaults.set("acc1", forKey: AuthenticationService.selectedAccountKey)
    defaults.set(Date().addingTimeInterval(60).timeIntervalSince1970, forKey: AuthenticationService.sessionExpiresAtKey)

    AuthenticationService.clearSession()

    XCTAssertNil(defaults.string(forKey: AuthenticationService.sessionKey))
    XCTAssertNil(defaults.string(forKey: AuthenticationService.usernameKey))
    XCTAssertNil(defaults.string(forKey: AuthenticationService.selectedAccountKey))
    XCTAssertNil(defaults.object(forKey: AuthenticationService.sessionExpiresAtKey))
  }

  func testClearSessionPostsSessionDidChange() {
    let expectation = expectation(forNotification: .expoSessionDidChange, object: nil)
    AuthenticationService.clearSession()
    wait(for: [expectation], timeout: 1)
  }
}
