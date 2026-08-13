// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class ExpoGoHomeBridgeAuthTests: XCTestCase {
  private let defaults = UserDefaults.standard

  override func setUp() {
    super.setUp()
    AuthenticationService.clearSession()
  }

  override func tearDown() {
    AuthenticationService.clearSession()
    super.tearDown()
  }

  func testNoSessionIsNotAuthenticated() {
    XCTAssertFalse(ExpoGoHomeBridge.shared.isAuthenticated())
    XCTAssertNil(ExpoGoHomeBridge.shared.authenticatedUsername())
    XCTAssertNil(ExpoGoHomeBridge.shared.expiredPartnerSessionMessage())
  }

  func testLiveSessionReportsUsername() {
    defaults.set("secret", forKey: AuthenticationService.sessionKey)
    defaults.set("partner-private-test", forKey: AuthenticationService.usernameKey)
    defaults.set(Date().addingTimeInterval(60).timeIntervalSince1970, forKey: AuthenticationService.sessionExpiresAtKey)

    XCTAssertTrue(ExpoGoHomeBridge.shared.isAuthenticated())
    XCTAssertEqual(ExpoGoHomeBridge.shared.authenticatedUsername(), "partner-private-test")
    XCTAssertNil(ExpoGoHomeBridge.shared.expiredPartnerSessionMessage())
  }

  func testExpiredSessionReportsNeitherAuthNorUsername() {
    defaults.set("secret", forKey: AuthenticationService.sessionKey)
    defaults.set("partner-private-test", forKey: AuthenticationService.usernameKey)
    defaults.set(Date().addingTimeInterval(-1).timeIntervalSince1970, forKey: AuthenticationService.sessionExpiresAtKey)

    XCTAssertFalse(ExpoGoHomeBridge.shared.isAuthenticated())
    XCTAssertNil(ExpoGoHomeBridge.shared.authenticatedUsername())
    XCTAssertEqual(
      ExpoGoHomeBridge.shared.expiredPartnerSessionMessage(),
      ExpoGoHomeBridge.expiredSessionMessage
    )
  }

  func testSessionWithoutExpiryReportsUsername() {
    defaults.set("secret", forKey: AuthenticationService.sessionKey)
    defaults.set("partner-private-test", forKey: AuthenticationService.usernameKey)

    XCTAssertTrue(ExpoGoHomeBridge.shared.isAuthenticated())
    XCTAssertEqual(ExpoGoHomeBridge.shared.authenticatedUsername(), "partner-private-test")
  }
}
