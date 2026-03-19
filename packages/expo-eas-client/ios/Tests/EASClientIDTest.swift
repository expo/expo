//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EASClient

class EASClientIdTests : XCTestCase {
  func testCreatesStableUUID() throws {
    let easClientId = EASClientID.uuid().uuidString
    XCTAssertNotNil(easClientId)

    let easClientId2 = EASClientID.uuid().uuidString
    XCTAssertEqual(easClientId, easClientId2)
  }

  func testDeterministicUniformValueKnownValue() {
    let uuid = UUID(uuidString: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890")!
    let value = EASClientID.deterministicUniformValue(uuid)
    XCTAssertEqual(value, 0.6711110515064663, accuracy: 1e-15)
  }

  func testDeterministicUniformValueRange() {
    let value = EASClientID.deterministicUniformValue(EASClientID.uuid())
    XCTAssertGreaterThanOrEqual(value, 0.0)
    XCTAssertLessThanOrEqual(value, 1.0)
  }

  func testDeterministicUniformValueDeterministic() {
    let uuid = UUID(uuidString: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890")!
    let a = EASClientID.deterministicUniformValue(uuid)
    let b = EASClientID.deterministicUniformValue(uuid)
    XCTAssertEqual(a, b)
  }

  func testUuidIsV4() {
    let uuid = EASClientID.uuid()
    let bytes = uuid.uuid
    // Version: high nibble of byte 6 must be 4
    XCTAssertEqual((bytes.6 >> 4) & 0x0F, 4)
    // Variant: high 2 bits of byte 8 must be 10
    XCTAssertEqual((bytes.8 >> 6) & 0x03, 2)
  }
}
