//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class EXUpdatesCodeSigningAlgorithmTests : XCTestCase {
  func test_parseCodeSigningAlgorithm() {
    XCTAssertEqual(try EXUpdatesCodeSigningAlgorithm.parseFromString(nil), EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertEqual(try EXUpdatesCodeSigningAlgorithm.parseFromString("rsa-v1_5-sha256"), EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertThrowsError(try EXUpdatesCodeSigningAlgorithm.parseFromString("invalid")) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.AlgorithmParseError)
    }
  }
}
