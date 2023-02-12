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
}
