// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import CommonCrypto
import ASN1Decoder

struct ABI48_0_0EXUpdatesCodeSigningMetadataFields {
  static let KeyIdFieldKey = "keyid"
  static let AlgorithmFieldKey = "alg"
}

@objc public enum ABI48_0_0EXUpdatesValidationResult : Int {
  case Valid
  case Invalid
  case Skipped
}


@objc
public class ABI48_0_0EXUpdatesSignatureValidationResult : NSObject {
  @objc private(set) public var validationResult: ABI48_0_0EXUpdatesValidationResult
  @objc private(set) public var expoProjectInformation: ABI48_0_0EXUpdatesExpoProjectInformation?
  
  required init(validationResult: ABI48_0_0EXUpdatesValidationResult, expoProjectInformation: ABI48_0_0EXUpdatesExpoProjectInformation?) {
    self.validationResult = validationResult
    self.expoProjectInformation = expoProjectInformation
  }
}

@objc
public class ABI48_0_0EXUpdatesCodeSigningConfiguration : NSObject {
  private var embeddedCertificateString: String
  private var keyIdFromMetadata: String
  private var algorithmFromMetadata: ABI48_0_0EXUpdatesCodeSigningAlgorithm
  private var includeManifestResponseCertificateChain: Bool
  private var allowUnsignedManifests: Bool
  
  @objc
  public required init(embeddedCertificateString: String,
                       metadata: [String: String],
                       includeManifestResponseCertificateChain: Bool,
                       allowUnsignedManifests: Bool) throws {
    self.embeddedCertificateString = embeddedCertificateString
    self.keyIdFromMetadata = metadata[ABI48_0_0EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey] ?? ABI48_0_0EXUpdatesSignatureHeaderInfo.DefaultKeyId
    self.algorithmFromMetadata = try ABI48_0_0EXUpdatesCodeSigningAlgorithm.parseFromString(metadata[ABI48_0_0EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey])
    self.includeManifestResponseCertificateChain = includeManifestResponseCertificateChain
    self.allowUnsignedManifests = allowUnsignedManifests
  }
  
  /**
   * String escaping is defined by https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.3
   */
  private static func escapeStructuredHeaderStringItem(_ str: String) -> String {
    return str.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
  }
  
  @objc
  public func createAcceptSignatureHeader() -> String {
    return "sig, keyid=\"\(ABI48_0_0EXUpdatesCodeSigningConfiguration.escapeStructuredHeaderStringItem(keyIdFromMetadata))\", alg=\"\(ABI48_0_0EXUpdatesCodeSigningConfiguration.escapeStructuredHeaderStringItem(algorithmFromMetadata.rawValue))\""
  }
  
  @objc
  public func validateSignature(signature: String?,
                                signedData: Data,
                                manifestResponseCertificateChain: String?) throws -> ABI48_0_0EXUpdatesSignatureValidationResult {
    guard let signature = signature else {
      if !self.allowUnsignedManifests {
        throw ABI48_0_0EXUpdatesCodeSigningError.SignatureHeaderMissing
      } else {
        // no-op
        return ABI48_0_0EXUpdatesSignatureValidationResult(validationResult: ABI48_0_0EXUpdatesValidationResult.Skipped, expoProjectInformation: nil)
      }
    }
    
    return try validateSignatureInternal(
      signatureHeaderInfo: try ABI48_0_0EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: signature),
      signedData: signedData,
      manifestResponseCertificateChain: manifestResponseCertificateChain
    )
  }
  
  private func validateSignatureInternal(signatureHeaderInfo: ABI48_0_0EXUpdatesSignatureHeaderInfo,
                                         signedData: Data,
                                         manifestResponseCertificateChain: String?) throws -> ABI48_0_0EXUpdatesSignatureValidationResult {
    let certificateChain: ABI48_0_0EXUpdatesCertificateChain
    if (self.includeManifestResponseCertificateChain) {
      certificateChain = try ABI48_0_0EXUpdatesCertificateChain(
        certificateStrings: ABI48_0_0EXUpdatesCodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: manifestResponseCertificateChain ?? "") + [self.embeddedCertificateString]
      )
    } else {
      // check that the key used to sign the response is the same as the key in the code signing certificate
      if (signatureHeaderInfo.keyId != self.keyIdFromMetadata) {
        throw ABI48_0_0EXUpdatesCodeSigningError.KeyIdMismatchError
      }

      // note that a mismatched algorithm doesn't fail early. it still tries to verify the signature with the
      // algorithm specified in the configuration
      if (signatureHeaderInfo.algorithm != self.algorithmFromMetadata) {
        NSLog("Key with alg=\(signatureHeaderInfo.algorithm) from signature does not match client configuration algorithm, continuing")
      }

      certificateChain = try ABI48_0_0EXUpdatesCertificateChain(certificateStrings: [embeddedCertificateString])
    }
    
    // For now only SHA256withRSA is supported. This technically should be `metadata.algorithm` but
    // it breaks down when metadata is for a different key than the signing key (the case where intermediate
    // certs are served alongside the manifest and the metadata is for the root embedded cert).
    // In the future if more methods are added we will need to be sure that we think about how to
    // specify what algorithm should be used in the chain case. One approach may be that in the case of
    // chains served alongside the manifest we fork the behavior to trust the `info.algorithm` while keeping
    // `metadata.algorithm` for the embedded case.
    let (secCertificate, _) = try certificateChain.codeSigningCertificate()
    
    guard let publicKey = secCertificate.publicKey else {
      throw ABI48_0_0EXUpdatesCodeSigningError.CertificateMissingPublicKeyError
    }
    
    guard let signatureData = Data(base64Encoded: signatureHeaderInfo.signature) else {
      throw ABI48_0_0EXUpdatesCodeSigningError.SignatureEncodingError
    }
    
    let isValid = try self.verifyRSASHA256SignedData(signedData: signedData, signatureData: signatureData, publicKey: publicKey)
    return ABI48_0_0EXUpdatesSignatureValidationResult(validationResult: isValid ? ABI48_0_0EXUpdatesValidationResult.Valid : ABI48_0_0EXUpdatesValidationResult.Invalid,
                                              expoProjectInformation: try certificateChain.codeSigningCertificate().1.expoProjectInformation())
  }
  
  private func verifyRSASHA256SignedData(signedData: Data, signatureData: Data, publicKey: SecKey) throws -> Bool {
    let hashBytes = signedData.sha256()
    var error: Unmanaged<CFError>?
    if SecKeyVerifySignature(publicKey, .rsaSignatureDigestPKCS1v15SHA256, hashBytes as CFData, signatureData as CFData, &error) {
      return true
    } else {
      if let error = error, (error.takeRetainedValue() as Error as NSError).code != errSecVerifyFailed {
        NSLog("Sec key signature verification error: %@", error.takeRetainedValue().localizedDescription)
        throw ABI48_0_0EXUpdatesCodeSigningError.SecurityFrameworkError
      }
      return false
    }
  }
  
  public static func separateCertificateChain(certificateChainInManifestResponse: String) -> [String] {
    let startDelimiter = "-----BEGIN CERTIFICATE-----"
    let endDelimiter = "-----END CERTIFICATE-----"
    var certificateStringList = [] as [String]
    
    var currStartIndex = certificateChainInManifestResponse.startIndex
    while (true) {
      let startIndex = certificateChainInManifestResponse.firstIndex(of: startDelimiter, startingAt: currStartIndex)
      let endIndex = certificateChainInManifestResponse.firstIndex(of: endDelimiter, startingAt: currStartIndex)
      
      if let startIndex = startIndex, let endIndex = endIndex {
        let newEndIndex = certificateChainInManifestResponse.index(endIndex, offsetBy: endDelimiter.count)
        certificateStringList.append(String(certificateChainInManifestResponse[startIndex..<newEndIndex]))
        currStartIndex = newEndIndex
      } else {
        break
      }
    }

    return certificateStringList
  }
}

extension SecCertificate {
  public var publicKey: SecKey? {
    SecCertificateCopyKey(self)
  }
}

extension OSStatus {
  public var isSuccess: Bool {
    self == errSecSuccess
  }
}

extension Data {
  func sha256() -> Data {
    var digest = Data(count: Int(CC_SHA256_DIGEST_LENGTH))
    withUnsafeBytes { bytes in
      digest.withUnsafeMutableBytes { mutableBytes in
        _ = CC_SHA256(bytes.baseAddress, CC_LONG(count), mutableBytes.bindMemory(to: UInt8.self).baseAddress)
      }
    }
    return digest
  }
}

extension String {
  func firstIndex(of: String, startingAt: String.Index) -> String.Index? {
    return self[startingAt...].range(of: of)?.lowerBound
  }
}
