// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import CommonCrypto
import ASN1Decoder

@objc public enum EXUpdatesCodeSigningConfigurationError : Int, Error {
  case CertificateParseError
  case CertificateValidityError
  case CertificateDigitalSignatureNotPresentError
  case CertificateMissingCodeSigningError
  case KeyIdMismatchError
  case PublicKeyInvalidError
  case SignatureEncodingError
}

struct EXUpdatesCodeSigningMetadataFields {
  static let KeyIdFieldKey = "keyid"
  static let AlgorithmFieldKey = "alg"
}

@objc
public class EXUpdatesCodeSigningConfiguration : NSObject {
  static let EXUpdatesCryptoRootPublicKeyTag = "exp.host.rootkey"
  
  // ASN.1 path to the extended key usage info within a CERT
  static let EXUpdatesCodeSigningCertificateExtendedUsageCodeSigningOID = "1.3.6.1.5.5.7.3.3"
  
  private var certificateDataDer: Data
  private var keyId: String
  private var algorithm: EXUpdatesCodeSigningAlgorithm
  
  @objc
  public required init(certificate: String, metadata: [String: String]) throws {
    guard let certificateData = certificate.data(using: .utf8) else { throw EXUpdatesCodeSigningConfigurationError.CertificateParseError }
    
    guard let certificateDataDer = EXUpdatesCodeSigningConfiguration.decodeToDER(pem: certificateData) else {
      throw EXUpdatesCodeSigningConfigurationError.CertificateParseError
    }
    self.certificateDataDer = certificateDataDer
    
    let x509Certificate = try X509Certificate(der: certificateDataDer)
    
    guard x509Certificate.checkValidity() else {
      throw EXUpdatesCodeSigningConfigurationError.CertificateValidityError
    }
    
    let keyUsage = x509Certificate.keyUsage
    if (x509Certificate.keyUsage.isEmpty || !keyUsage[0]) {
      throw EXUpdatesCodeSigningConfigurationError.CertificateDigitalSignatureNotPresentError
    }
    
    let extendedKeyUsage = x509Certificate.extendedKeyUsage
    if (!extendedKeyUsage.contains(EXUpdatesCodeSigningConfiguration.EXUpdatesCodeSigningCertificateExtendedUsageCodeSigningOID)) {
      throw EXUpdatesCodeSigningConfigurationError.CertificateMissingCodeSigningError
    }
    
    keyId = metadata[EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey] ?? EXUpdatesSignatureHeaderInfo.DefaultKeyId
    algorithm = try parseCodeSigningAlgorithm(str: metadata[EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey])
  }
  
  @objc
  func createAcceptSignatureHeader() -> String {
    return "sig, keyid=\"\(keyId)\", alg=\"\(algorithm.rawValue)\""
  }
  
  @objc
  public func verifySignatureHeaderInfo(signatureHeaderInfo: EXUpdatesSignatureHeaderInfo, signedData: Data) throws -> NSNumber {
    // check that the key used to sign the response is the same as the key embedded in the configuration
    // TODO(wschurman): this may change for child certificates and development certificates
    if (signatureHeaderInfo.keyId != self.keyId) {
      throw EXUpdatesCodeSigningConfigurationError.KeyIdMismatchError
    }
    
    // note that a mismatched algorithm doesn't fail early. it still tries to verify the signature with the
    // algorithm specified in the configuration
    if (signatureHeaderInfo.algorithm != self.algorithm) {
      NSLog("Key with alg=\(signatureHeaderInfo.algorithm) from signature does not match client configuration algorithm, continuing")
    }
    
    guard let certificate = SecCertificateCreateWithData(nil, certificateDataDer as CFData) else {
      throw EXUpdatesCodeSigningConfigurationError.CertificateParseError
    }
    guard let publicKey = SecCertificateCopyPublicKey(certificate) else {
      throw EXUpdatesCodeSigningConfigurationError.CertificateParseError
    }
    
    guard let signatureData = Data(base64Encoded: signatureHeaderInfo.signature) else {
      throw EXUpdatesCodeSigningConfigurationError.SignatureEncodingError
    }
    
    let isValid = try self.verifyRSASHA256SignedData(signedData: signedData, signatureData: signatureData, publicKey: publicKey)
    return isValid ? NSNumber(booleanLiteral: true) : NSNumber(booleanLiteral: false)
  }
  
  private func sha256(data : Data) -> Data {
      var digest = Data(count: Int(CC_SHA256_DIGEST_LENGTH))
      data.withUnsafeBytes { bytes in
        digest.withUnsafeMutableBytes { mutableBytes in
          _ = CC_SHA256(bytes.baseAddress, CC_LONG(data.count), mutableBytes.bindMemory(to: UInt8.self).baseAddress)
        }
      }
      return digest
  }
  
  private func verifyRSASHA256SignedData(signedData: Data, signatureData: Data, publicKey: SecKey) throws -> Bool {
    let hashBytes = self.sha256(data: signedData)
    var error: Unmanaged<CFError>?
    return SecKeyVerifySignature(publicKey, .rsaSignatureDigestPKCS1v15SHA256, hashBytes as CFData, signatureData as CFData, &error)
  }
  
  private static let beginPemBlock = "-----BEGIN CERTIFICATE-----"
  private static let endPemBlock   = "-----END CERTIFICATE-----"
  
  private static func decodeToDER(pem pemData: Data) -> Data? {
    if let pem = String(data: pemData, encoding: .ascii), pem.contains(beginPemBlock) {
      let lines = pem.components(separatedBy: .newlines)
      var base64buffer  = ""
      var certLine = false
      for line in lines {
        if line == endPemBlock {
          certLine = false
        }
        if certLine {
          base64buffer.append(line)
        }
        if line == beginPemBlock {
          certLine = true
        }
      }
      if let derDataDecoded = Data(base64Encoded: base64buffer) {
        return derDataDecoded
      }
    }

    return nil
  }
}
