//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("CodeSigningAlgorithm")
struct CodeSigningAlgorithmTests {
  @Test
  func `parses code signing algorithm`() throws {
    #expect(try CodeSigningAlgorithm.parseFromString(nil) == CodeSigningAlgorithm.RSA_SHA256)
    #expect(try CodeSigningAlgorithm.parseFromString("rsa-v1_5-sha256") == CodeSigningAlgorithm.RSA_SHA256)
    #expect {
      try CodeSigningAlgorithm.parseFromString("invalid")
    } throws: { error in
      guard case CodeSigningError.AlgorithmParseError = error else {
        return false
      }
      return true
    }
  }
}
