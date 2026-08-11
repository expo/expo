// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class DeviceLoginLinkTests: XCTestCase {
  private func url(_ string: String) throws -> URL {
    try XCTUnwrap(URL(string: string))
  }

  // MARK: reading

  func testReadsHTTPSOverride() throws {
    let parsed = DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?verification_uri_override=https%3A%2F%2Fpartner.dev%2Fp%2F123")
    )
    XCTAssertEqual(parsed?.absoluteString, "https://partner.dev/p/123")
  }

  func testReadsOverrideAlongsideOtherParams() throws {
    let parsed = DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?snack-channel=abc&verification_uri_override=https%3A%2F%2Fpartner.dev")
    )
    XCTAssertEqual(parsed?.absoluteString, "https://partner.dev")
  }

  func testReturnsNilWhenParameterAbsent() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(from: try url("exp://10.0.0.5:8081/")))
  }

  func testReturnsNilForEmptyValue() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?verification_uri_override=")
    ))
  }

  func testRejectsPlainHTTP() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?verification_uri_override=http%3A%2F%2Fpartner.dev")
    ))
  }

  func testRejectsSchemelessValue() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?verification_uri_override=partner.dev%2Fp")
    ))
  }

  func testRejectsHostlessValue() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?verification_uri_override=https%3A%2F%2F%2Fjust-a-path")
    ))
  }

  func testRejectsCustomScheme() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?verification_uri_override=javascript%3Aalert(1)")
    ))
  }

  // MARK: stripping

  func testStripRemovesOnlyTheOverride() throws {
    let stripped = DeviceLoginLink.urlByRemovingOverride(
      from: try url("exp://10.0.0.5:8081/?a=1&verification_uri_override=https%3A%2F%2Fp.dev&b=2")
    )
    XCTAssertEqual(stripped.absoluteString, "exp://10.0.0.5:8081/?a=1&b=2")
  }

  func testStripPreservesEncodingOfOtherItems() throws {
    let stripped = DeviceLoginLink.urlByRemovingOverride(
      from: try url("exp://10.0.0.5:8081/?snack-channel=a%2Bb&verification_uri_override=https%3A%2F%2Fp.dev")
    )
    XCTAssertEqual(stripped.absoluteString, "exp://10.0.0.5:8081/?snack-channel=a%2Bb")
  }

  func testStripDropsTheQueryEntirelyWhenNothingRemains() throws {
    let stripped = DeviceLoginLink.urlByRemovingOverride(
      from: try url("exp://10.0.0.5:8081/?verification_uri_override=https%3A%2F%2Fp.dev")
    )
    XCTAssertEqual(stripped.absoluteString, "exp://10.0.0.5:8081/")
  }

  func testStripIsIdentityWhenAbsent() throws {
    let original = try url("exp://10.0.0.5:8081/?a=1")
    XCTAssertEqual(DeviceLoginLink.urlByRemovingOverride(from: original).absoluteString, original.absoluteString)
  }

  func testStripLeavesAnInvalidOverrideValueRemoved() throws {
    // Validation and stripping are independent. A rejected value must still not reach the dev server.
    let stripped = DeviceLoginLink.urlByRemovingOverride(
      from: try url("exp://10.0.0.5:8081/?verification_uri_override=http%3A%2F%2Fp.dev&a=1")
    )
    XCTAssertEqual(stripped.absoluteString, "exp://10.0.0.5:8081/?a=1")
  }

  // MARK: pending holder

  func testPendingHolderStoresAndClears() throws {
    let uri = try url("https://partner.dev/p/123")
    PendingDeviceLogin.shared.set(uri)
    XCTAssertEqual(PendingDeviceLogin.shared.current, uri)
    PendingDeviceLogin.shared.clear()
    XCTAssertNil(PendingDeviceLogin.shared.current)
  }
}
