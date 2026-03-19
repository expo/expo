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

  func testUuidToIntervalKnownValue() {
    let uuid = UUID(uuidString: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890")!
    let interval = EASClientID.uuidToInterval(uuid)
    XCTAssertEqual(interval, 0.9211200650509653, accuracy: 1e-15)
  }

  func testUuidToIntervalRange() {
    let interval = EASClientID.uuidToInterval(EASClientID.uuid())
    XCTAssertGreaterThanOrEqual(interval, 0.0)
    XCTAssertLessThanOrEqual(interval, 1.0)
  }

  func testUuidToIntervalDeterministic() {
    let uuid = UUID(uuidString: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890")!
    let a = EASClientID.uuidToInterval(uuid)
    let b = EASClientID.uuidToInterval(uuid)
    XCTAssertEqual(a, b)
  }
}
