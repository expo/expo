//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

class CodeSigningAlgorithmSpec : ExpoSpec {
  override class func spec() {
    it("parses code signing algorithm") {
      expect(try  CodeSigningAlgorithm.parseFromString(nil)) == CodeSigningAlgorithm.RSA_SHA256
      expect(try  CodeSigningAlgorithm.parseFromString("rsa-v1_5-sha256")) == CodeSigningAlgorithm.RSA_SHA256
      expect { try CodeSigningAlgorithm.parseFromString("invalid") }.to(throwError(CodeSigningError.AlgorithmParseError))
    }
  }
}
