// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class ExpoGoHomeBridgeAuthTests: XCTestCase {
  private let bridge = ExpoGoHomeBridge.shared
  private let username = "testuser"

  override func setUp() {
    super.setUp()
    removeAuthKeys()
  }

  override func tearDown() {
    removeAuthKeys()
    super.tearDown()
  }

  private func removeAuthKeys() {
    let defaults = UserDefaults.standard
    defaults.removeObject(forKey: AuthenticationService.sessionKey)
    defaults.removeObject(forKey: AuthenticationService.usernameKey)
    defaults.removeObject(forKey: AuthenticationService.sessionExpiresAtKey)
  }

  func testNormalUserSignedInThroughTheCLIStaysAuthenticated() {
    UserDefaults.standard.set("secret", forKey: AuthenticationService.sessionKey)
    UserDefaults.standard.set(username, forKey: AuthenticationService.usernameKey)

    XCTAssertTrue(bridge.isAuthenticated())
    XCTAssertEqual(bridge.authenticatedUsername(), username)
  }

  func testExpiredPartnerSessionIsNotAuthenticated() {
    UserDefaults.standard.set("secret", forKey: AuthenticationService.sessionKey)
    UserDefaults.standard.set(username, forKey: AuthenticationService.usernameKey)
    UserDefaults.standard.set(
      Date().addingTimeInterval(-3600).timeIntervalSince1970,
      forKey: AuthenticationService.sessionExpiresAtKey
    )

    XCTAssertFalse(bridge.isAuthenticated())
    XCTAssertNil(bridge.authenticatedUsername())
    XCTAssertNotNil(bridge.expiredPartnerSessionMessage())
  }

  func testLivePartnerSessionIsAuthenticated() {
    UserDefaults.standard.set("secret", forKey: AuthenticationService.sessionKey)
    UserDefaults.standard.set(username, forKey: AuthenticationService.usernameKey)
    UserDefaults.standard.set(
      Date().addingTimeInterval(3600).timeIntervalSince1970,
      forKey: AuthenticationService.sessionExpiresAtKey
    )

    XCTAssertEqual(bridge.authenticatedUsername(), username)
    XCTAssertNil(bridge.expiredPartnerSessionMessage())
  }

  func testSignedOutHasNoAuthentication() {
    XCTAssertFalse(bridge.isAuthenticated())
    XCTAssertNil(bridge.authenticatedUsername())
  }
}
