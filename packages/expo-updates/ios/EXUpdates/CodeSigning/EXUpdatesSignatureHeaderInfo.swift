// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXStructuredHeaders

struct EXUpdatesSignatureHeaderFields {
  static let SignatureFieldKey = "sig"
  static let KeyIdFieldKey = "keyid"
  static let AlgorithmFieldKey = "alg"
}

@objc
public final class EXUpdatesSignatureHeaderInfo : NSObject {
  static let DefaultKeyId = "root"
  
  let signature: String
  let keyId: String
  let algorithm: EXUpdatesCodeSigningAlgorithm
  
  private init(signature: String, keyId: String, algorithm: EXUpdatesCodeSigningAlgorithm) {
    self.signature = signature
    self.keyId = keyId
    self.algorithm = algorithm
  }
  
  @objc
  public static func parseSignatureHeader(signatureHeader: String?) throws -> EXUpdatesSignatureHeaderInfo {
    guard let signatureHeader = signatureHeader else {
      throw EXUpdatesCodeSigningError.SignatureHeaderMissing
    }
    
    let parser = EXStructuredHeadersParser.init(rawInput: signatureHeader,
                                                fieldType: EXStructuredHeadersParserFieldType.dictionary,
                                                ignoringParameters: true)
    let parserOutput = try parser.parseStructuredFields()
    guard let parserOutputDictionary = parserOutput as? Dictionary<String, String> else {
      throw EXUpdatesCodeSigningError.SignatureHeaderStructuredFieldParseError
    }
    
    guard let signatureFieldValue = parserOutputDictionary[EXUpdatesSignatureHeaderFields.SignatureFieldKey] else {
      throw EXUpdatesCodeSigningError.SignatureHeaderSigMissing
    }
    
    return EXUpdatesSignatureHeaderInfo(signature: signatureFieldValue,
                                        keyId: parserOutputDictionary[EXUpdatesSignatureHeaderFields.KeyIdFieldKey] ?? EXUpdatesSignatureHeaderInfo.DefaultKeyId,
                                        algorithm: try EXUpdatesCodeSigningAlgorithm.parseFromString(parserOutputDictionary[EXUpdatesSignatureHeaderFields.AlgorithmFieldKey]))
  }
}
