//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class EXUpdatesCodeSigningAlgorithmTests : XCTestCase {
  func test_parseCodeSigningAlgorithm() {
    XCTAssertEqual(try parseCodeSigningAlgorithm(str: nil), EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertEqual(try parseCodeSigningAlgorithm(str: "rsa-v1_5-sha256"), EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertThrowsError(try parseCodeSigningAlgorithm(str: "invalid")) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningAlgorithmError, EXUpdatesCodeSigningAlgorithmError.parseError)
    }
  }
}
