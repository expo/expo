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

  func testUuidToIntervalBoundaries() {
    let zero = UUID(uuidString: "00000000-0000-0000-0000-000000000000")!
    XCTAssertEqual(EASClientID.uuidToInterval(zero), 0.0)

    let max = UUID(uuidString: "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF")!
    XCTAssertEqual(EASClientID.uuidToInterval(max), 1.0)
  }

  func testUuidToIntervalMidpoint() {
    let mid = UUID(uuidString: "80000000-0000-0000-0000-000000000000")!
    let interval = EASClientID.uuidToInterval(mid)
    XCTAssertEqual(interval, 0.5, accuracy: 0.001)
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
