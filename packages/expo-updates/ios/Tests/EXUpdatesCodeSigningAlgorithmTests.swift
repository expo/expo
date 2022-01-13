//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class EXUpdatesCodeSigningAlgorithmTests : XCTestCase {
  func test_parseCodeSigningAlgorithm() {
    XCTAssertEqual(try parseCodeSigningAlgorithm(nil), EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertEqual(try parseCodeSigningAlgorithm("rsa-v1_5-sha256"), EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertThrowsError(try parseCodeSigningAlgorithm("invalid")) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningAlgorithmError, EXUpdatesCodeSigningAlgorithmError.parseError)
    }
  }
}
