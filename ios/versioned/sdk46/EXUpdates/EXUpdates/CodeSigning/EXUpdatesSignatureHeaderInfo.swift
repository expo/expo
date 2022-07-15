// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import ABI46_0_0EXStructuredHeaders

struct ABI46_0_0EXUpdatesSignatureHeaderFields {
  static let SignatureFieldKey = "sig"
  static let KeyIdFieldKey = "keyid"
  static let AlgorithmFieldKey = "alg"
}

public final class ABI46_0_0EXUpdatesSignatureHeaderInfo {
  static let DefaultKeyId = "root"
  
  let signature: String
  let keyId: String
  let algorithm: ABI46_0_0EXUpdatesCodeSigningAlgorithm
  
  private init(signature: String, keyId: String, algorithm: ABI46_0_0EXUpdatesCodeSigningAlgorithm) {
    self.signature = signature
    self.keyId = keyId
    self.algorithm = algorithm
  }
  
  public static func parseSignatureHeader(signatureHeader: String) throws -> ABI46_0_0EXUpdatesSignatureHeaderInfo {    
    let parser = ABI46_0_0EXStructuredHeadersParser.init(rawInput: signatureHeader,
                                                fieldType: ABI46_0_0EXStructuredHeadersParserFieldType.dictionary,
                                                ignoringParameters: true)
    let parserOutput = try parser.parseStructuredFields()
    guard let parserOutputDictionary = parserOutput as? Dictionary<String, String> else {
      throw ABI46_0_0EXUpdatesCodeSigningError.SignatureHeaderStructuredFieldParseError
    }
    
    guard let signatureFieldValue = parserOutputDictionary[ABI46_0_0EXUpdatesSignatureHeaderFields.SignatureFieldKey] else {
      throw ABI46_0_0EXUpdatesCodeSigningError.SignatureHeaderSigMissing
    }
    
    return ABI46_0_0EXUpdatesSignatureHeaderInfo(signature: signatureFieldValue,
                                        keyId: parserOutputDictionary[ABI46_0_0EXUpdatesSignatureHeaderFields.KeyIdFieldKey] ?? ABI46_0_0EXUpdatesSignatureHeaderInfo.DefaultKeyId,
                                        algorithm: try ABI46_0_0EXUpdatesCodeSigningAlgorithm.parseFromString(parserOutputDictionary[ABI46_0_0EXUpdatesSignatureHeaderFields.AlgorithmFieldKey]))
  }
}
