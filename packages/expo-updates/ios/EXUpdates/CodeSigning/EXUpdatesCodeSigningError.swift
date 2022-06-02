// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc public enum EXUpdatesCodeSigningError : Int, Error {
  case CertificateEncodingError
  case CertificateDERDecodeError
  case CertificateValidityError
  case CertificateMissingPublicKeyError
  case CertificateDigitalSignatureNotPresentError
  case CertificateMissingCodeSigningError
  case CertificateRootNotCA
  case CertificateProjectInformationChainError
  case KeyIdMismatchError
  case SecurityFrameworkError
  case CertificateEmptyError
  case CertificateChainError
  case CertificateRootNotSelfSigned
  case SignatureHeaderMissing
  case SignatureHeaderStructuredFieldParseError
  case SignatureHeaderSigMissing
  case SignatureHeaderSignatureEncodingError
  case SignatureEncodingError
  case AlgorithmParseError
  case InvalidExpoProjectInformationExtensionValue
}

@objc public class EXUpdatesCodeSigningErrorUtils : NSObject {
  @objc public static func message(forError: EXUpdatesCodeSigningError) -> String {
    switch forError {
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
    case .SecurityFrameworkError:
      return "Signature verification failed due to security framework error"
    case .CertificateEmptyError:
      return "No code signing certificates provided"
    case .CertificateChainError:
      return "Certificate chain error"
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
