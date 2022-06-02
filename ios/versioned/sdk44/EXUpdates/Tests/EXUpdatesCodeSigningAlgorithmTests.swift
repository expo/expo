//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import ABI44_0_0EXUpdates

class ABI44_0_0EXUpdatesCodeSigningAlgorithmTests : XCTestCase {
  func test_parseCodeSigningAlgorithm() {
    XCTAssertEqual(try ABI44_0_0EXUpdatesCodeSigningAlgorithm.parseFromString(nil), ABI44_0_0EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertEqual(try ABI44_0_0EXUpdatesCodeSigningAlgorithm.parseFromString("rsa-v1_5-sha256"), ABI44_0_0EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertThrowsError(try ABI44_0_0EXUpdatesCodeSigningAlgorithm.parseFromString("invalid")) { error in
      XCTAssertEqual(error as? ABI44_0_0EXUpdatesCodeSigningError, ABI44_0_0EXUpdatesCodeSigningError.AlgorithmParseError)
    }
  }
}
