// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum EXUpdatesCodeSigningAlgorithm: String {
    case RSA_SHA256 = "rsa-v1_5-sha256"
}

extension EXUpdatesCodeSigningAlgorithm {
  static func parseFromString(_ str: String?) throws -> EXUpdatesCodeSigningAlgorithm {
    guard let str = str else {
      return EXUpdatesCodeSigningAlgorithm.RSA_SHA256
    }

    guard let alg = EXUpdatesCodeSigningAlgorithm(rawValue: str) else {
      throw EXUpdatesCodeSigningError.AlgorithmParseError
    }
    
    return alg
  }
}
