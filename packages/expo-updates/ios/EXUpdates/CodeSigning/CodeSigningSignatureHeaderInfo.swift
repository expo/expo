// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXStructuredHeaders

struct SignatureHeaderFields {
  static let SignatureFieldKey = "sig"
  static let KeyIdFieldKey = "keyid"
  static let AlgorithmFieldKey = "alg"
}

public final class CodeSigningSignatureHeaderInfo {
  static let DefaultKeyId = "root"
  
  let signature: String
  let keyId: String
  let algorithm: CodeSigningAlgorithm
  
  private init(signature: String, keyId: String, algorithm: CodeSigningAlgorithm) {
    self.signature = signature
    self.keyId = keyId
    self.algorithm = algorithm
  }
  
  public static func parseSignatureHeader(signatureHeader: String) throws -> CodeSigningSignatureHeaderInfo {    
    let parser = EXStructuredHeadersParser.init(rawInput: signatureHeader,
                                                fieldType: EXStructuredHeadersParserFieldType.dictionary,
                                                ignoringParameters: true)
    let parserOutput = try parser.parseStructuredFields()
    guard let parserOutputDictionary = parserOutput as? Dictionary<String, String> else {
      throw CodeSigningError.SignatureHeaderStructuredFieldParseError
    }
    
    guard let signatureFieldValue = parserOutputDictionary[SignatureHeaderFields.SignatureFieldKey] else {
      throw CodeSigningError.SignatureHeaderSigMissing
    }
    
    return CodeSigningSignatureHeaderInfo(signature: signatureFieldValue,
                                        keyId: parserOutputDictionary[SignatureHeaderFields.KeyIdFieldKey] ?? CodeSigningSignatureHeaderInfo.DefaultKeyId,
                                        algorithm: try CodeSigningAlgorithm.parseFromString(parserOutputDictionary[SignatureHeaderFields.AlgorithmFieldKey]))
  }
}
