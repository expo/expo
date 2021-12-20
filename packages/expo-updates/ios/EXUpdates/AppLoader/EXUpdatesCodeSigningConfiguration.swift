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
  
  private var publicKey: X509PublicKey
  private var keyId: String
  private var algorithm: EXUpdatesCodeSigningAlgorithm
  
  @objc
  public required init(certificate: String, metadata: [String: String]) throws {
    guard let certificateData = certificate.data(using: .utf8) else { throw EXUpdatesCodeSigningConfigurationError.CertificateParseError }
    let x509Certificate = try X509Certificate(data: certificateData)
    
    guard let notAfter = x509Certificate.notAfter, let notBefore = x509Certificate.notBefore else {
      throw EXUpdatesCodeSigningConfigurationError.CertificateValidityError
    }
    
    let now = Date()
    guard notBefore <= now && notAfter >= now else {
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
    
    guard let publicKeyLocal = x509Certificate.publicKey else { throw EXUpdatesCodeSigningConfigurationError.CertificateParseError }
    
    publicKey = publicKeyLocal
    keyId = metadata[EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey] ?? EXUpdatesSignatureHeaderInfo.DefaultKeyId
    algorithm = try parseCodeSigningAlgorithm(str: metadata[EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey])
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
    
    guard let keyData = self.publicKey.key else {
      throw EXUpdatesCodeSigningConfigurationError.PublicKeyInvalidError
    }
    
    guard let publicKey = try self.keyRefFromPEMData(pemData: keyData) else {
      return false
    }
    
    guard let signatureData = Data(base64Encoded: signatureHeaderInfo.signature) else {
      throw EXUpdatesCodeSigningConfigurationError.SignatureEncodingError
    }
    
    let isValid = self.verifyRSASHA256SignedData(signedData: signedData, signatureData: signatureData, publicKey: publicKey)
    return isValid ? NSNumber(booleanLiteral: true) : NSNumber(booleanLiteral: false)
  }
  
  /**
   *  Returns a CFRef to a SecKey given the raw pem data.
   *  The CFRef should be CFReleased when you're finished.
   *
   *  Here is the Apple doc for this black hole:
   *  https://developer.apple.com/library/prerelease/content/documentation/Security/Conceptual/CertKeyTrustProgGuide/iPhone_Tasks/iPhone_Tasks.html#//apple_ref/doc/uid/TP40001358-CH208-SW13
   */
  private func keyRefFromPEMData(pemData: Data) throws -> SecKey? {
    let tag = EXUpdatesCodeSigningConfiguration.EXUpdatesCryptoRootPublicKeyTag.data(using: .utf8)
    
    let deleteQuery: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
      kSecAttrApplicationTag as String: tag as Any,
    ]
    SecItemDelete(deleteQuery as CFDictionary)
    
    // Add key to system keychain.
    let addQuery: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
      kSecAttrApplicationTag as String: tag as Any,
      kSecAttrKeyClass as String: kSecAttrKeyClassPublic,
      kSecReturnPersistentRef as String: kCFBooleanTrue as Any,
      kSecValueData as String: pemData,
      kSecAttrKeySizeInBits as String: pemData.count,
      kSecAttrEffectiveKeySize as String: pemData.count,
      kSecAttrCanDerive as String: kCFBooleanFalse as Any,
      kSecAttrCanEncrypt as String: kCFBooleanTrue as Any,
      kSecAttrCanDecrypt as String: kCFBooleanFalse as Any,
      kSecAttrCanVerify as String: kCFBooleanTrue as Any,
      kSecAttrCanSign as String: kCFBooleanFalse as Any,
      kSecAttrCanWrap as String: kCFBooleanTrue as Any,
      kSecAttrCanUnwrap as String: kCFBooleanFalse as Any,
    ];
    
    let secStatus = SecItemAdd(addQuery as CFDictionary, nil)
    guard secStatus != noErr && secStatus != errSecDuplicateItem else {
      return nil
    }
    
    // Fetch the SecKeyRef version of the key.
    // note that kSecAttrKeyClass: kSecAttrKeyClassPublic doesn't seem to be required here.
    // also: this doesn't work on iOS < 10.0
    var keyRef: CFTypeRef?
    let copyMatchingQuery: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
      kSecAttrApplicationTag as String: tag as Any,
      kSecReturnRef as String: kCFBooleanTrue as Any,
    ];
    
    let secStatusCopyMatching = SecItemCopyMatching(copyMatchingQuery as CFDictionary, &keyRef);
    guard secStatusCopyMatching != noErr else {
      return nil
    }
    
    return keyRef as! SecKey?;
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
  
  private func verifyRSASHA256SignedData(signedData: Data, signatureData: Data, publicKey: SecKey) -> Bool {
    let hashBytes = self.sha256(data: signedData)
    var error: Unmanaged<CFError>?
    return SecKeyVerifySignature(publicKey, SecKeyAlgorithm.rsaSignatureDigestPKCS1v15SHA256, hashBytes as CFData, signatureData as CFData, &error)
  }
}
