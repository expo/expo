//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class CodeSigningAlgorithmTests : XCTestCase {
  func test_parseCodeSigningAlgorithm() {
    XCTAssertEqual(try CodeSigningAlgorithm.parseFromString(nil), CodeSigningAlgorithm.RSA_SHA256)
    XCTAssertEqual(try CodeSigningAlgorithm.parseFromString("rsa-v1_5-sha256"), CodeSigningAlgorithm.RSA_SHA256)
    XCTAssertThrowsError(try CodeSigningAlgorithm.parseFromString("invalid")) { error in
      XCTAssertEqual(error as? CodeSigningError, CodeSigningError.AlgorithmParseError)
    }
  }
}
