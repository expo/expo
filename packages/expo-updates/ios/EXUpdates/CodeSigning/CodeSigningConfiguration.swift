// Copyright 2015-present 650 Industries. All rights reserved.

// swiftlint:disable identifier_name

import Foundation
import CommonCrypto

internal struct CodeSigningMetadataFields {
  static let KeyIdFieldKey = "keyid"
  static let AlgorithmFieldKey = "alg"
}

internal enum ValidationResult {
  case valid
  case invalid
  case skipped
}

internal final class SignatureValidationResult {
  private(set) internal var validationResult: ValidationResult
  private(set) internal var expoProjectInformation: ExpoProjectInformation?

  required init(validationResult: ValidationResult, expoProjectInformation: ExpoProjectInformation?) {
    self.validationResult = validationResult
    self.expoProjectInformation = expoProjectInformation
  }
}

@objc(EXUpdatesCodeSigningConfiguration)
public final class CodeSigningConfiguration: NSObject {
  private var embeddedCertificateString: String
  private var keyIdFromMetadata: String
  private var algorithmFromMetadata: CodeSigningAlgorithm
  private var includeManifestResponseCertificateChain: Bool
  private var allowUnsignedManifests: Bool

  internal required init(
    embeddedCertificateString: String,
    metadata: [String: String],
    includeManifestResponseCertificateChain: Bool,
    allowUnsignedManifests: Bool
  ) throws {
    self.embeddedCertificateString = embeddedCertificateString
    self.keyIdFromMetadata = metadata[CodeSigningMetadataFields.KeyIdFieldKey] ?? SignatureHeaderInfo.DefaultKeyId
    self.algorithmFromMetadata = try CodeSigningAlgorithm.parseFromString(metadata[CodeSigningMetadataFields.AlgorithmFieldKey])
    self.includeManifestResponseCertificateChain = includeManifestResponseCertificateChain
    self.allowUnsignedManifests = allowUnsignedManifests
  }

  /**
   * String escaping is defined by https://www.rfc-editor.org/rfc/rfc8941.html#section-3.3.3
   */
  private static func escapeStructuredHeaderStringItem(_ str: String) -> String {
    return str.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
  }

  internal func createAcceptSignatureHeader() -> String {
    return "sig, keyid=\"\(CodeSigningConfiguration.escapeStructuredHeaderStringItem(keyIdFromMetadata))\", alg=\"\(CodeSigningConfiguration.escapeStructuredHeaderStringItem(algorithmFromMetadata.rawValue))\""
  }

  internal func validateSignature(
    logger: UpdatesLogger,
    signature: String?,
    signedData: Data,
    manifestResponseCertificateChain: String?
  ) throws -> SignatureValidationResult {
    guard let signature = signature else {
      if !self.allowUnsignedManifests {
        throw CodeSigningError.SignatureHeaderMissing
      } else {
        // no-op
        return SignatureValidationResult(validationResult: ValidationResult.skipped, expoProjectInformation: nil)
      }
    }

    return try validateSignatureInternal(
      logger: logger,
      signatureHeaderInfo: try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: signature),
      signedData: signedData,
      manifestResponseCertificateChain: manifestResponseCertificateChain
    )
  }

  private func validateSignatureInternal(
    logger: UpdatesLogger,
    signatureHeaderInfo: SignatureHeaderInfo,
    signedData: Data,
    manifestResponseCertificateChain: String?
  ) throws -> SignatureValidationResult {
    let certificateChain: CertificateChain
    if self.includeManifestResponseCertificateChain {
      certificateChain = try CertificateChain(
        certificateStrings: CodeSigningConfiguration.separateCertificateChain(
          certificateChainInManifestResponse: manifestResponseCertificateChain ?? ""
        ) + [self.embeddedCertificateString]
      )
    } else {
      // check that the key used to sign the response is the same as the key in the code signing certificate
      if signatureHeaderInfo.keyId != self.keyIdFromMetadata {
        throw CodeSigningError.KeyIdMismatchError
      }

      // note that a mismatched algorithm doesn't fail early. it still tries to verify the signature with the
      // algorithm specified in the configuration
      if signatureHeaderInfo.algorithm != self.algorithmFromMetadata {
        logger.warn(message: "Key with alg=\(signatureHeaderInfo.algorithm) from signature does not match client configuration algorithm, continuing")
      }

      certificateChain = try CertificateChain(certificateStrings: [embeddedCertificateString])
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
      throw CodeSigningError.CertificateMissingPublicKeyError
    }

    guard let signatureData = Data(base64Encoded: signatureHeaderInfo.signature) else {
      throw CodeSigningError.SignatureEncodingError
    }

    let isValid = try self.verifyRSASHA256SignedData(signedData: signedData, signatureData: signatureData, publicKey: publicKey)
    return SignatureValidationResult(
      validationResult: isValid ? ValidationResult.valid : ValidationResult.invalid,
      expoProjectInformation: try certificateChain.codeSigningCertificate().1.expoProjectInformation()
    )
  }

  private func verifyRSASHA256SignedData(signedData: Data, signatureData: Data, publicKey: SecKey) throws -> Bool {
    let hashBytes = signedData.sha256()
    var error: Unmanaged<CFError>?
    if SecKeyVerifySignature(publicKey, .rsaSignatureDigestPKCS1v15SHA256, hashBytes as CFData, signatureData as CFData, &error) {
      return true
    }
    if let error = error, (error.takeRetainedValue() as Error as NSError).code != errSecVerifyFailed {
      throw CodeSigningError.SecurityFrameworkSecKeyVerificationError(cause: error.takeRetainedValue())
    }
    return false
  }

  internal static func separateCertificateChain(certificateChainInManifestResponse: String) -> [String] {
    let startDelimiter = "-----BEGIN CERTIFICATE-----"
    let endDelimiter = "-----END CERTIFICATE-----"
    var certificateStringList = [] as [String]

    var currStartIndex = certificateChainInManifestResponse.startIndex
    while true {
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

private extension SecCertificate {
  var publicKey: SecKey? {
    SecCertificateCopyKey(self)
  }
}

internal extension OSStatus {
  var isSuccess: Bool {
    self == errSecSuccess
  }
}

private extension Data {
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

private extension String {
  func firstIndex(of: String, startingAt: String.Index) -> String.Index? {
    return self[startingAt...].range(of: of)?.lowerBound
  }
}

// swiftlint:enable identifier_name
