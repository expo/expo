// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class ExpoGoHomeBridgeAuthTests: XCTestCase {
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
    XCTAssertNil(ExpoGoHomeBridge.shared.sessionExpiredMessage())
  }

  func testLiveSessionReportsUsername() async {
    await AuthenticationService.storeDeviceAuthSession(
      sessionSecret: "secret",
      username: "test-user",
      expiresAt: Date().addingTimeInterval(60)
    )
    XCTAssertTrue(ExpoGoHomeBridge.shared.isAuthenticated())
    XCTAssertEqual(ExpoGoHomeBridge.shared.authenticatedUsername(), "test-user")
    XCTAssertNil(ExpoGoHomeBridge.shared.sessionExpiredMessage())
  }

  func testExpiredSessionReportsNeitherAuthNorUsername() async {
    await AuthenticationService.storeDeviceAuthSession(
      sessionSecret: "secret",
      username: "test-user",
      expiresAt: Date().addingTimeInterval(-1)
    )
    XCTAssertFalse(ExpoGoHomeBridge.shared.isAuthenticated())
    XCTAssertNil(ExpoGoHomeBridge.shared.authenticatedUsername())
    XCTAssertEqual(
      ExpoGoHomeBridge.shared.sessionExpiredMessage(),
      ExpoGoHomeBridge.expiredSessionMessage
    )
  }

  func testSessionWithoutExpiryReportsUsername() async {
    await AuthenticationService.storeDeviceAuthSession(
      sessionSecret: "secret",
      username: "test-user",
      expiresAt: nil
    )
    XCTAssertTrue(ExpoGoHomeBridge.shared.isAuthenticated())
    XCTAssertEqual(ExpoGoHomeBridge.shared.authenticatedUsername(), "test-user")
  }
}
