// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class PartnerLoginServiceTests: XCTestCase {
  func testNetworkErrorMapsToNetworkErrorMessage() {
    let error = LoginError.networkError(NSError(domain: "test", code: 1))
    XCTAssertEqual(PartnerLoginService.message(for: error), PartnerLoginService.networkErrorMessage)
  }

  func testApiErrorMapsToInvalidCodeMessage() {
    let error = LoginError.apiError("x")
    XCTAssertEqual(PartnerLoginService.message(for: error), PartnerLoginService.invalidCodeMessage)
  }

  func testInvalidCredentialsMapsToInvalidCodeMessage() {
    let error = LoginError.invalidCredentials("x")
    XCTAssertEqual(PartnerLoginService.message(for: error), PartnerLoginService.invalidCodeMessage)
  }

  func testOtpRequiredMapsToInvalidCodeMessage() {
    let error = LoginError.otpRequired(devices: [], smsAutomaticallySent: false)
    XCTAssertEqual(PartnerLoginService.message(for: error), PartnerLoginService.invalidCodeMessage)
  }

  func testNonLoginErrorMapsToUnexpectedResponseMessage() {
    let error = NSError(domain: "test", code: 1)
    XCTAssertEqual(PartnerLoginService.message(for: error), PartnerLoginService.unexpectedResponseMessage)
  }

  func testLoginErrorDescriptionIsTheEnumsOwnMessage() {
    let error = LoginError.invalidCredentials("Invalid or expired login code.")
    XCTAssertEqual(error.localizedDescription, "Invalid or expired login code.")
  }
}
