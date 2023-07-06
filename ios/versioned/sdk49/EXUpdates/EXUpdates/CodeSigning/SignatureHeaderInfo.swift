// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import ABI49_0_0EXStructuredHeaders

struct SignatureHeaderFields {
  static let SignatureFieldKey = "sig"
  static let KeyIdFieldKey = "keyid"
  static let AlgorithmFieldKey = "alg"
}

internal final class SignatureHeaderInfo {
  static let DefaultKeyId = "root"

  let signature: String
  let keyId: String
  let algorithm: CodeSigningAlgorithm

  private init(signature: String, keyId: String, algorithm: CodeSigningAlgorithm) {
    self.signature = signature
    self.keyId = keyId
    self.algorithm = algorithm
  }

  static func parseSignatureHeader(signatureHeader: String) throws -> SignatureHeaderInfo {
    let parser = ABI49_0_0EXStructuredHeadersParser(
      rawInput: signatureHeader,
      fieldType: ABI49_0_0EXStructuredHeadersParserFieldType.dictionary,
      ignoringParameters: true
    )
    guard let parserOutputDictionary = try parser.parseStructuredFields() as? [String: String] else {
      throw CodeSigningError.SignatureHeaderStructuredFieldParseError
    }

    guard let signatureFieldValue = parserOutputDictionary[SignatureHeaderFields.SignatureFieldKey] else {
      throw CodeSigningError.SignatureHeaderSigMissing
    }

    return SignatureHeaderInfo(
      signature: signatureFieldValue,
      keyId: parserOutputDictionary[SignatureHeaderFields.KeyIdFieldKey] ?? SignatureHeaderInfo.DefaultKeyId,
      algorithm: try CodeSigningAlgorithm.parseFromString(parserOutputDictionary[SignatureHeaderFields.AlgorithmFieldKey])
    )
  }
}
