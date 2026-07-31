// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class PartnerSessionExpiryTests: XCTestCase {
  private let expiresAtKey = "expo-session-expires-at"

  override func setUp() {
    super.setUp()
    UserDefaults.standard.removeObject(forKey: expiresAtKey)
  }

  override func tearDown() {
    UserDefaults.standard.removeObject(forKey: expiresAtKey)
    super.tearDown()
  }

  /// Pins the literal so this test file cannot drift from the production key name.
  func testKeyNameMatchesTheOneDeclaredOnAuthenticationService() {
    XCTAssertEqual(AuthenticationService.sessionExpiresAtKey, expiresAtKey)
  }

  func testNotExpiredWhenTheKeyIsAbsent() {
    XCTAssertFalse(AuthenticationService.isPartnerSessionExpired())
  }

  func testNotExpiredForAFutureExpiry() {
    UserDefaults.standard.set(Date().addingTimeInterval(3600).timeIntervalSince1970, forKey: expiresAtKey)
    XCTAssertFalse(AuthenticationService.isPartnerSessionExpired())
  }

  func testExpiredForAPastExpiry() {
    UserDefaults.standard.set(Date().addingTimeInterval(-3600).timeIntervalSince1970, forKey: expiresAtKey)
    XCTAssertTrue(AuthenticationService.isPartnerSessionExpired())
  }

  func testExpiredAtTheBoundary() {
    UserDefaults.standard.set(Date().timeIntervalSince1970 - 0.001, forKey: expiresAtKey)
    XCTAssertTrue(AuthenticationService.isPartnerSessionExpired())
  }

  func testClearSessionRemovesTheExpiry() {
    UserDefaults.standard.set(Date().addingTimeInterval(3600).timeIntervalSince1970, forKey: expiresAtKey)
    AuthenticationService.clearSession()
    XCTAssertNil(UserDefaults.standard.object(forKey: expiresAtKey))
  }
}
