// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import ABI44_0_0EXStructuredHeaders

struct ABI44_0_0EXUpdatesSignatureHeaderFields {
  static let SignatureFieldKey = "sig"
  static let KeyIdFieldKey = "keyid"
  static let AlgorithmFieldKey = "alg"
}

public final class ABI44_0_0EXUpdatesSignatureHeaderInfo {
  static let DefaultKeyId = "root"
  
  let signature: String
  let keyId: String
  let algorithm: ABI44_0_0EXUpdatesCodeSigningAlgorithm
  
  private init(signature: String, keyId: String, algorithm: ABI44_0_0EXUpdatesCodeSigningAlgorithm) {
    self.signature = signature
    self.keyId = keyId
    self.algorithm = algorithm
  }
  
  public static func parseSignatureHeader(signatureHeader: String) throws -> ABI44_0_0EXUpdatesSignatureHeaderInfo {    
    let parser = ABI44_0_0EXStructuredHeadersParser.init(rawInput: signatureHeader,
                                                fieldType: ABI44_0_0EXStructuredHeadersParserFieldType.dictionary,
                                                ignoringParameters: true)
    let parserOutput = try parser.parseStructuredFields()
    guard let parserOutputDictionary = parserOutput as? Dictionary<String, String> else {
      throw ABI44_0_0EXUpdatesCodeSigningError.SignatureHeaderStructuredFieldParseError
    }
    
    guard let signatureFieldValue = parserOutputDictionary[ABI44_0_0EXUpdatesSignatureHeaderFields.SignatureFieldKey] else {
      throw ABI44_0_0EXUpdatesCodeSigningError.SignatureHeaderSigMissing
    }
    
    return ABI44_0_0EXUpdatesSignatureHeaderInfo(signature: signatureFieldValue,
                                        keyId: parserOutputDictionary[ABI44_0_0EXUpdatesSignatureHeaderFields.KeyIdFieldKey] ?? ABI44_0_0EXUpdatesSignatureHeaderInfo.DefaultKeyId,
                                        algorithm: try ABI44_0_0EXUpdatesCodeSigningAlgorithm.parseFromString(parserOutputDictionary[ABI44_0_0EXUpdatesSignatureHeaderFields.AlgorithmFieldKey]))
  }
}
