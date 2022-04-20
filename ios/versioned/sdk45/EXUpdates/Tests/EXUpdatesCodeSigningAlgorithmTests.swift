//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import ABI45_0_0EXUpdates

class ABI45_0_0EXUpdatesCodeSigningAlgorithmTests : XCTestCase {
  func test_parseCodeSigningAlgorithm() {
    XCTAssertEqual(try ABI45_0_0EXUpdatesCodeSigningAlgorithm.parseFromString(nil), ABI45_0_0EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertEqual(try ABI45_0_0EXUpdatesCodeSigningAlgorithm.parseFromString("rsa-v1_5-sha256"), ABI45_0_0EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertThrowsError(try ABI45_0_0EXUpdatesCodeSigningAlgorithm.parseFromString("invalid")) { error in
      XCTAssertEqual(error as? ABI45_0_0EXUpdatesCodeSigningError, ABI45_0_0EXUpdatesCodeSigningError.AlgorithmParseError)
    }
  }
}
