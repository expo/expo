// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class DeviceLoginLinkTests: XCTestCase {
  private func url(_ string: String) throws -> URL {
    try XCTUnwrap(URL(string: string))
  }

  // MARK: prompt

  func testPromptRequestedWhenTriggerIsOne() throws {
    XCTAssertTrue(DeviceLoginLink.promptRequested(
      in: try url("exp://10.0.0.5:8081/?expo_go_prompt_device_auth=1")
    ))
  }

  func testPromptNotRequestedWhenTriggerIsZero() throws {
    XCTAssertFalse(DeviceLoginLink.promptRequested(
      in: try url("exp://10.0.0.5:8081/?expo_go_prompt_device_auth=0")
    ))
  }

  func testPromptNotRequestedWhenTriggerAbsent() throws {
    XCTAssertFalse(DeviceLoginLink.promptRequested(in: try url("exp://10.0.0.5:8081/")))
  }

  func testOverrideAloneDoesNotPrompt() throws {
    XCTAssertFalse(DeviceLoginLink.promptRequested(
      in: try url("exp://10.0.0.5:8081/?expo_go_device_auth_verification_uri_override=https%3A%2F%2Fverify.example")
    ))
  }

  // MARK: reading the override

  func testReadsHTTPSOverride() throws {
    let parsed = DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?expo_go_prompt_device_auth=1&expo_go_device_auth_verification_uri_override=https%3A%2F%2Fverify.example%2Fp%2F123")
    )
    XCTAssertEqual(parsed?.absoluteString, "https://verify.example/p/123")
  }

  func testReadsOverrideAlongsideOtherParams() throws {
    let parsed = DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?snack-channel=abc&expo_go_device_auth_verification_uri_override=https%3A%2F%2Fverify.example")
    )
    XCTAssertEqual(parsed?.absoluteString, "https://verify.example")
  }

  func testReturnsNilWhenOverrideAbsent() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?expo_go_prompt_device_auth=1")
    ))
  }

  func testReturnsNilForEmptyValue() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?expo_go_device_auth_verification_uri_override=")
    ))
  }

  func testRejectsPlainHTTP() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?expo_go_device_auth_verification_uri_override=http%3A%2F%2Fverify.example")
    ))
  }

  func testRejectsSchemelessValue() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?expo_go_device_auth_verification_uri_override=verify.example%2Fp")
    ))
  }

  func testRejectsHostlessValue() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?expo_go_device_auth_verification_uri_override=https%3A%2F%2F%2Fjust-a-path")
    ))
  }

  func testRejectsCustomScheme() throws {
    XCTAssertNil(DeviceLoginLink.verificationURI(
      from: try url("exp://10.0.0.5:8081/?expo_go_device_auth_verification_uri_override=javascript%3Aalert(1)")
    ))
  }

  // MARK: stripping

  func testStripRemovesBothParams() throws {
    let stripped = DeviceLoginLink.urlByRemovingDeviceAuthParams(
      from: try url("exp://10.0.0.5:8081/?a=1&expo_go_prompt_device_auth=1&expo_go_device_auth_verification_uri_override=https%3A%2F%2Fverify.example&b=2")
    )
    XCTAssertEqual(stripped.absoluteString, "exp://10.0.0.5:8081/?a=1&b=2")
  }

  func testStripRemovesTriggerAlone() throws {
    let stripped = DeviceLoginLink.urlByRemovingDeviceAuthParams(
      from: try url("exp://10.0.0.5:8081/?expo_go_prompt_device_auth=1&a=1")
    )
    XCTAssertEqual(stripped.absoluteString, "exp://10.0.0.5:8081/?a=1")
  }

  func testStripPreservesEncodingOfOtherItems() throws {
    let stripped = DeviceLoginLink.urlByRemovingDeviceAuthParams(
      from: try url("exp://10.0.0.5:8081/?snack-channel=a%2Bb&expo_go_prompt_device_auth=1")
    )
    XCTAssertEqual(stripped.absoluteString, "exp://10.0.0.5:8081/?snack-channel=a%2Bb")
  }

  func testStripDropsTheQueryEntirelyWhenNothingRemains() throws {
    let stripped = DeviceLoginLink.urlByRemovingDeviceAuthParams(
      from: try url("exp://10.0.0.5:8081/?expo_go_prompt_device_auth=1")
    )
    XCTAssertEqual(stripped.absoluteString, "exp://10.0.0.5:8081/")
  }

  func testStripIsIdentityWhenAbsent() throws {
    let original = try url("exp://10.0.0.5:8081/?a=1")
    XCTAssertEqual(DeviceLoginLink.urlByRemovingDeviceAuthParams(from: original).absoluteString, original.absoluteString)
  }

  func testStripRemovesAnInvalidOverride() throws {
    let stripped = DeviceLoginLink.urlByRemovingDeviceAuthParams(
      from: try url("exp://10.0.0.5:8081/?expo_go_device_auth_verification_uri_override=http%3A%2F%2Fverify.example&a=1")
    )
    XCTAssertEqual(stripped.absoluteString, "exp://10.0.0.5:8081/?a=1")
  }

  // MARK: pending holder

  func testPendingHolderStoresAndClears() throws {
    let uri = try url("https://verify.example/p/123")
    PendingDeviceLogin.shared.set(uri)
    XCTAssertEqual(PendingDeviceLogin.shared.current, uri)
    PendingDeviceLogin.shared.clear()
    XCTAssertNil(PendingDeviceLogin.shared.current)
  }
}
