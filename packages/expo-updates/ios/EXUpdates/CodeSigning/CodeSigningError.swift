// Copyright 2015-present 650 Industries. All rights reserved.

// swiftlint:disable identifier_name

public enum CodeSigningError: Error, Sendable, LocalizedError {
  public enum CertificateChainErrorReason: Sendable {
    case couldNotCreateSecTrust(osStatus: OSStatus)
    case couldNotSetAnchorOnSecTrust(osStatus: OSStatus)
    case couldNotSetAnchorOnlySettingOnSecTrust(osStatus: OSStatus)
    case couldNotDisableNetworkFetchOnSecTrust(osStatus: OSStatus)
    case secTrustEvaluationError(cause: Error?)

    var localizedDescription: String {
      switch self {
      case let .couldNotCreateSecTrust(osStatus):
        return "Could not create sec trust with certificates (OSStatus: \(osStatus))"
      case let .couldNotSetAnchorOnSecTrust(osStatus):
        return "Could not set anchor certificates on sec trust (OSStatus: \(osStatus))"
      case let .couldNotSetAnchorOnlySettingOnSecTrust(osStatus):
        return "Could not set anchor certificates only setting on sec trust (OSStatus: \(osStatus))"
      case let .couldNotDisableNetworkFetchOnSecTrust(osStatus):
        return "Could not disable network fetch on sec trust (OSStatus: \(osStatus))"
      case let .secTrustEvaluationError(cause):
        return "Sec trust evaluation error: \(cause?.localizedDescription ?? "Unknown evaluation error")"
      }
    }
  }

  case CertificateEncodingError
  case CertificateDERDecodeError
  case CertificateValidityError
  case CertificateMissingPublicKeyError
  case CertificateDigitalSignatureNotPresentError
  case CertificateMissingCodeSigningError
  case CertificateRootNotCA
  case CertificateProjectInformationChainError
  case KeyIdMismatchError
  case SecurityFrameworkSecKeyVerificationError(cause: Error)
  case CertificateEmptyError
  case CertificateChainError(reason: CertificateChainErrorReason)
  case CertificateRootNotSelfSigned
  case SignatureHeaderMissing
  case SignatureHeaderStructuredFieldParseError
  case SignatureHeaderSigMissing
  case SignatureHeaderSignatureEncodingError
  case SignatureEncodingError
  case AlgorithmParseError
  case InvalidExpoProjectInformationExtensionValue

  public var errorDescription: String? {
    switch self {
    case .CertificateEncodingError:
      return "Code signing certificate could not be encoded in a lossless manner using utf8 encoding"
    case .CertificateDERDecodeError:
      return "Code signing certificate data not in DER format"
    case .CertificateMissingPublicKeyError:
      return "Code signing certificate missing public key"
    case .CertificateValidityError:
      return "Certificate not valid"
    case .CertificateDigitalSignatureNotPresentError:
      return "Certificate digital signature not present"
    case .CertificateMissingCodeSigningError:
      return "Certificate missing code signing extended key usage"
    case .CertificateRootNotCA:
      return "Root certificate subject must be a Certificate Authority"
    case .CertificateProjectInformationChainError:
      return "Expo project information must be a subset or equal of that of parent certificates"
    case .KeyIdMismatchError:
      return "Key with keyid from signature not found in client configuration"
    case let .SecurityFrameworkSecKeyVerificationError(cause):
      return "Signature verification failed due to security framework sec key verification error: \(cause.localizedDescription)"
    case .CertificateEmptyError:
      return "No code signing certificates provided"
    case let .CertificateChainError(reason):
      return "Certificate chain error: \(reason.localizedDescription)"
    case .CertificateRootNotSelfSigned:
      return "Root certificate not self-signed"
    case .SignatureHeaderMissing:
      return "No expo-signature header specified"
    case .SignatureHeaderStructuredFieldParseError:
      return "expo-signature structured header parsing failed"
    case .SignatureHeaderSigMissing:
      return "Structured field sig not found in expo-signature header"
    case .SignatureHeaderSignatureEncodingError:
      return "Signature in header has invalid encoding"
    case .SignatureEncodingError:
      return "Invalid signature encoding"
    case .AlgorithmParseError:
      return "Invalid algorithm"
    case .InvalidExpoProjectInformationExtensionValue:
      return "Invalid Expo project information extension value"
    }
  }
}

// swiftlint:enable identifier_name
