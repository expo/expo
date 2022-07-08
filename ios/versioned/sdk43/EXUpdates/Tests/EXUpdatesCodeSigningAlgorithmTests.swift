//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import ABI43_0_0EXUpdates

class ABI43_0_0EXUpdatesCodeSigningAlgorithmTests : XCTestCase {
  func test_parseCodeSigningAlgorithm() {
    XCTAssertEqual(try ABI43_0_0EXUpdatesCodeSigningAlgorithm.parseFromString(nil), ABI43_0_0EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertEqual(try ABI43_0_0EXUpdatesCodeSigningAlgorithm.parseFromString("rsa-v1_5-sha256"), ABI43_0_0EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    XCTAssertThrowsError(try ABI43_0_0EXUpdatesCodeSigningAlgorithm.parseFromString("invalid")) { error in
      XCTAssertEqual(error as? ABI43_0_0EXUpdatesCodeSigningError, ABI43_0_0EXUpdatesCodeSigningError.AlgorithmParseError)
    }
  }
}
