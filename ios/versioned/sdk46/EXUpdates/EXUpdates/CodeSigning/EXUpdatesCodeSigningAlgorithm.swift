// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum ABI46_0_0EXUpdatesCodeSigningAlgorithm: String {
    case RSA_SHA256 = "rsa-v1_5-sha256"
}

extension ABI46_0_0EXUpdatesCodeSigningAlgorithm {
  static func parseFromString(_ str: String?) throws -> ABI46_0_0EXUpdatesCodeSigningAlgorithm {
    guard let str = str else {
      return ABI46_0_0EXUpdatesCodeSigningAlgorithm.RSA_SHA256
    }

    guard let alg = ABI46_0_0EXUpdatesCodeSigningAlgorithm(rawValue: str) else {
      throw ABI46_0_0EXUpdatesCodeSigningError.AlgorithmParseError
    }
    
    return alg
  }
}
