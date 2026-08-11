// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class DeviceLoginModelsTests: XCTestCase {
  private func payload(_ json: String) throws -> DeviceTokenPayload {
    let data = try XCTUnwrap(json.data(using: .utf8))
    return try JSONDecoder().decode(DeviceTokenResponse.self, from: data).data
  }

  private func outcome(_ json: String) throws -> TokenOutcome {
    TokenOutcome(payload: try payload(json))
  }

  // MARK: authorization response

  func testDecodesAuthorizationResponse() throws {
    let json = """
    {"data":{"device_code":"Aag-CvhX","user_code":"FRCK-VFRN",
      "verification_uri":"https://expo.dev/oauth/device","expires_in":599,"interval":5}}
    """
    let data = try XCTUnwrap(json.data(using: .utf8))
    let authorization = try JSONDecoder().decode(DeviceAuthorizationResponse.self, from: data).data

    XCTAssertEqual(authorization.deviceCode, "Aag-CvhX")
    XCTAssertEqual(authorization.userCode, "FRCK-VFRN")
    XCTAssertEqual(authorization.verificationURI.absoluteString, "https://expo.dev/oauth/device")
    XCTAssertEqual(authorization.expiresIn, 599)
    XCTAssertEqual(authorization.interval, 5)
  }

  // MARK: expiry parsing

  func testParsesExpiryWithFractionalSeconds() {
    let date = DeviceLoginDates.parseExpiry("2026-08-11T12:34:56.789Z")
    XCTAssertNotNil(date)
  }

  func testParsesExpiryWithoutFractionalSeconds() {
    let date = DeviceLoginDates.parseExpiry("2026-08-11T12:34:56Z")
    XCTAssertNotNil(date)
  }

  func testRejectsUnparseableExpiry() {
    XCTAssertNil(DeviceLoginDates.parseExpiry("not a date"))
  }

  // MARK: outcome mapping

  func testMapsSuccessWithExpiry() throws {
    let result = try outcome("""
    {"data":{"session_secret":"secret","expires_at":"2026-08-11T12:34:56.789Z"}}
    """)
    guard case .session(let secret, let expiresAt) = result else {
      return XCTFail("expected .session, got \(result)")
    }
    XCTAssertEqual(secret, "secret")
    XCTAssertNotNil(expiresAt)
  }

  func testMapsSuccessWithUnparseableExpiryToASessionWithNoExpiry() throws {
    let result = try outcome(#"{"data":{"session_secret":"secret","expires_at":"garbage"}}"#)
    XCTAssertEqual(result, .session(secret: "secret", expiresAt: nil))
  }

  func testMapsAuthorizationPending() throws {
    XCTAssertEqual(try outcome(#"{"data":{"error":"authorization_pending"}}"#), .pending)
  }

  func testMapsSlowDown() throws {
    XCTAssertEqual(try outcome(#"{"data":{"error":"slow_down"}}"#), .slowDown)
  }

  func testMapsMatchingRequiredWithOptions() throws {
    XCTAssertEqual(
      try outcome(#"{"data":{"error":"matching_required","match_options":["42","17","93"]}}"#),
      .matchRequired(["42", "17", "93"])
    )
  }

  func testMapsMatchingRequiredWithNoOptionsToInvalid() throws {
    // Three options are always sent. Their absence means the contract changed, not that we should
    // show an empty picker.
    XCTAssertEqual(try outcome(#"{"data":{"error":"matching_required"}}"#), .invalid)
  }

  func testMapsAccessDenied() throws {
    XCTAssertEqual(try outcome(#"{"data":{"error":"access_denied"}}"#), .denied)
  }

  func testMapsExpiredToken() throws {
    XCTAssertEqual(try outcome(#"{"data":{"error":"expired_token"}}"#), .expired)
  }

  func testMapsInvalidGrant() throws {
    XCTAssertEqual(try outcome(#"{"data":{"error":"invalid_grant"}}"#), .invalid)
  }

  func testMapsUnknownErrorToInvalid() throws {
    XCTAssertEqual(try outcome(#"{"data":{"error":"something_new"}}"#), .invalid)
  }

  func testMapsEmptyPayloadToInvalid() throws {
    XCTAssertEqual(try outcome(#"{"data":{}}"#), .invalid)
  }

  // MARK: request encoding

  func testEncodesTokenRequestWithSnakeCaseKeys() throws {
    let request = DeviceTokenRequest(clientId: "expo-go", deviceCode: "abc", matchValue: "42")
    let encoded = try JSONEncoder().encode(request)
    let object = try XCTUnwrap(
      try JSONSerialization.jsonObject(with: encoded) as? [String: Any]
    )
    XCTAssertEqual(object["grant_type"] as? String, "urn:ietf:params:oauth:grant-type:device_code")
    XCTAssertEqual(object["client_id"] as? String, "expo-go")
    XCTAssertEqual(object["device_code"] as? String, "abc")
    XCTAssertEqual(object["match_value"] as? String, "42")
  }

  func testOmitsMatchValueWhenAbsent() throws {
    let request = DeviceTokenRequest(clientId: "expo-go", deviceCode: "abc", matchValue: nil)
    let encoded = try JSONEncoder().encode(request)
    let object = try XCTUnwrap(
      try JSONSerialization.jsonObject(with: encoded) as? [String: Any]
    )
    XCTAssertNil(object["match_value"])
  }
}
