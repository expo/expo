// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXStructuredHeaders

@objc public enum EXUpdatesSignatureHeaderInfoError: Int, Error {
  case MissingSignatureHeader
  case StructuredFieldParseError
  case SigMissing
}

struct EXUpdatesSignatureHeaderFields {
  static let SignatureFieldKey = "sig"
  static let KeyIdFieldKey = "keyid"
  static let AlgorithmFieldKey = "alg"
}

@objc
public class EXUpdatesSignatureHeaderInfo : NSObject {
  static let DefaultKeyId = "root"
  
  var signature: String
  var keyId: String
  var algorithm: EXUpdatesCodeSigningAlgorithm
  
  @objc
  public required init(signatureHeader: String?) throws {
    guard let signatureHeader = signatureHeader else {
      throw EXUpdatesSignatureHeaderInfoError.MissingSignatureHeader
    }
    
    let parser = EXStructuredHeadersParser.init(rawInput: signatureHeader,
                                                fieldType: EXStructuredHeadersParserFieldType.dictionary,
                                                ignoringParameters: true)
    let parserOutput = try parser.parseStructuredFields()
    guard let parserOutputDictionary = parserOutput as? Dictionary<String, String> else {
      throw EXUpdatesSignatureHeaderInfoError.StructuredFieldParseError
    }
    
    guard let signatureFieldValue = parserOutputDictionary[EXUpdatesSignatureHeaderFields.SignatureFieldKey] else {
      throw EXUpdatesSignatureHeaderInfoError.SigMissing
    }
    
    signature = signatureFieldValue
    keyId = parserOutputDictionary[EXUpdatesSignatureHeaderFields.KeyIdFieldKey] ?? EXUpdatesSignatureHeaderInfo.DefaultKeyId
    algorithm = try parseCodeSigningAlgorithm(parserOutputDictionary[EXUpdatesSignatureHeaderFields.AlgorithmFieldKey])
  }
}
