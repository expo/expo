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
    // splitmix64(mostSignificantBits ^ leastSignificantBits), scaled by 2^53.
    XCTAssertEqual(value, 0.5075081783308123, accuracy: 1e-15)
  }

  func testDeterministicUniformValueRange() {
    let value = EASClientID.deterministicUniformValue(EASClientID.uuid())
    XCTAssertGreaterThanOrEqual(value, 0.0)
    XCTAssertLessThan(value, 1.0)
  }

  func testDeterministicUniformValueDeterministic() {
    let uuid = UUID(uuidString: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890")!
    let a = EASClientID.deterministicUniformValue(uuid)
    let b = EASClientID.deterministicUniformValue(uuid)
    XCTAssertEqual(a, b)
  }

  /// A known-value test passes for any biased formula, so occupying the whole range is the
  /// property that actually matters to callers comparing `value < threshold`.
  func testDeterministicUniformValueIsUniformlyDistributed() {
    let occupiedDeciles = Set(
      (0..<2000).map { seed -> Int in
        let value = EASClientID.deterministicUniformValue(Self.makeV4UUID(seed: UInt64(seed)))

        XCTAssertGreaterThanOrEqual(value, 0.0)
        XCTAssertLessThan(value, 1.0)

        return Int(value * 10)
      }
    )

    XCTAssertEqual(occupiedDeciles, Set(0..<10))
  }

  func testUuidIsV4() {
    let uuid = EASClientID.uuid()
    let bytes = uuid.uuid
    // Version: high nibble of byte 6 must be 4
    XCTAssertEqual((bytes.6 >> 4) & 0x0F, 4)
    // Variant: high 2 bits of byte 8 must be 10
    XCTAssertEqual((bytes.8 >> 6) & 0x03, 2)
  }

  /// Builds RFC 4122 v4-shaped UUIDs from a seeded LCG so the distribution assertions are
  /// reproducible rather than relying on random input.
  private static func makeV4UUID(seed: UInt64) -> UUID {
    var state = seed
    func nextByte() -> UInt8 {
      state = state &* 6364136223846793005 &+ 1442695040888963407
      return UInt8(truncatingIfNeeded: state >> 33)
    }

    var b = [UInt8](repeating: 0, count: 16)
    for index in 0..<16 {
      b[index] = nextByte()
    }
    b[6] = (b[6] & 0x0F) | 0x40  // version 4
    b[8] = (b[8] & 0x3F) | 0x80  // variant 10

    return UUID(uuid: (b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7],
                       b[8], b[9], b[10], b[11], b[12], b[13], b[14], b[15]))
  }
}
