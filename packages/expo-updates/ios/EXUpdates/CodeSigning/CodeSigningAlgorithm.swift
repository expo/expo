// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum CodeSigningAlgorithm: String {
  case RSA_SHA256 = "rsa-v1_5-sha256"

  internal static func parseFromString(_ str: String?) throws -> CodeSigningAlgorithm {
    guard let str = str else {
      return CodeSigningAlgorithm.RSA_SHA256
    }

    guard let alg = CodeSigningAlgorithm(rawValue: str) else {
      throw CodeSigningError.AlgorithmParseError
    }

    return alg
  }
}
