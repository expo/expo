// Copyright 2015-present 650 Industries. All rights reserved.

// swiftlint:disable force_unwrapping
// swiftlint:disable identifier_name

internal typealias Certificate = (SecCertificate, X509Certificate)

internal final class ExpoProjectInformation: Equatable {
  private(set) var projectId: String
  private(set) var scopeKey: String

  required init(projectId: String, scopeKey: String) {
    self.projectId = projectId
    self.scopeKey = scopeKey
  }

  static func == (lhs: ExpoProjectInformation, rhs: ExpoProjectInformation) -> Bool {
    return lhs.projectId == rhs.projectId && lhs.scopeKey == rhs.scopeKey
  }
}

/**
 * Full certificate chain for verifying code signing.
 * The chain should look like the following:
 *    0: code signing certificate
 *    1...n-1: intermediate certificates
 *    n: root certificate
 *
 * Requirements:
 * - Length(certificateChain) > 0
 * - certificate chain is valid and each certificate is valid
 * - 0th certificate is a valid code signing certificate
 */
internal final class CertificateChain {
  // ASN.1 path to the extended key usage info within a CERT
  static let CodeSigningCertificateExtendedUsageCodeSigningOID = "1.3.6.1.5.5.7.3.3"
  // OID of expo project info, stored as `<projectId>,<scopeKey>`
  static let CodeSigningCertificateExpoProjectInformationOID = "1.2.840.113556.1.8000.2554.43437.254.128.102.157.7894389.20439.2.1"

  private var certificateStrings: [String]

  required init(certificateStrings: [String]) throws {
    self.certificateStrings = certificateStrings
  }

  func codeSigningCertificate() throws -> Certificate {
    if certificateStrings.isEmpty {
      throw CodeSigningError.CertificateEmptyError
    }

    let certificateChain = try certificateStrings.map { certificateString throws in
      try CertificateChain.constructCertificate(certificateString: certificateString)
    }
    try certificateChain.validateChain()

    let leafCertificate = certificateChain.first!
    let (_, x509LeafCertificate) = leafCertificate
    if !x509LeafCertificate.isCodeSigningCertificate() {
      throw CodeSigningError.CertificateMissingCodeSigningError
    }

    return leafCertificate
  }

  private static func constructCertificate(certificateString: String) throws -> Certificate {
    guard let certificateData = certificateString.data(using: .utf8) else {
      throw CodeSigningError.CertificateEncodingError
    }

    guard let certificateDataDer = Crypto.decodePEMToDER(pem: certificateData, pemType: .certificate) else {
      throw CodeSigningError.CertificateDERDecodeError
    }

    let x509Certificate = try X509Certificate(der: certificateDataDer)

    guard x509Certificate.checkValidity() else {
      throw CodeSigningError.CertificateValidityError
    }

    guard let secCertificate = SecCertificateCreateWithData(nil, certificateDataDer as CFData) else {
      throw CodeSigningError.CertificateDERDecodeError
    }

    return (secCertificate, x509Certificate)
  }
}

internal extension X509Certificate {
  func isCACertificate() -> Bool {
    if let ext = self.extensionObject(oid: .basicConstraints) as? X509Certificate.BasicConstraintExtension {
      if !ext.isCA {
        return false
      }
    } else {
      return false
    }

    let keyUsage = self.keyUsage
    if keyUsage.isEmpty || !keyUsage[5] {
      return false
    }

    return true
  }

  func isCodeSigningCertificate() -> Bool {
    let keyUsage = self.keyUsage
    if keyUsage.isEmpty || !keyUsage[0] {
      return false
    }

    let extendedKeyUsage = self.extendedKeyUsage
    if !extendedKeyUsage.contains(CertificateChain.CodeSigningCertificateExtendedUsageCodeSigningOID) {
      return false
    }

    return true
  }

  func expoProjectInformation() throws -> ExpoProjectInformation? {
    guard let projectInformationExtensionValue = extensionObject(oid: CertificateChain.CodeSigningCertificateExpoProjectInformationOID)?.value else {
      return nil
    }

    guard let projectInformationExtensionValue = projectInformationExtensionValue as? String else {
      throw CodeSigningError.InvalidExpoProjectInformationExtensionValue
    }

    let components = projectInformationExtensionValue
      .components(separatedBy: ",")
      .map { it in
        it.trimmingCharacters(in: CharacterSet.whitespaces)
      }
    if components.count != 2 {
      throw CodeSigningError.InvalidExpoProjectInformationExtensionValue
    }
    return ExpoProjectInformation(projectId: components[0], scopeKey: components[1])
  }
}

private extension Array where Element == Certificate {
  func validateChain() throws {
    let (anchorSecCert, anchorX509Cert) = self.last!

    // only trust anchor if self-signed
    if anchorX509Cert.subjectDistinguishedName != anchorX509Cert.issuerDistinguishedName {
      throw CodeSigningError.CertificateRootNotSelfSigned
    }

    let secCertificates = self.map { secCertificate, _ in
      secCertificate
    }
    let trust = try SecTrust.create(certificates: secCertificates, policy: SecPolicyCreateBasicX509())
    try trust.setAnchorCertificates([anchorSecCert])
    try trust.disableNetwork()
    try trust.evaluate()

    if count > 1 {
      let (_, rootX509Cert) = self.last!
      if !rootX509Cert.isCACertificate() {
        throw CodeSigningError.CertificateRootNotCA
      }

      var lastExpoProjectInformation = try rootX509Cert.expoProjectInformation()
      // all certificates between (root, leaf]
      for i in (0...(count - 2)).reversed() {
        let (_, x509Cert) = self[i]
        let currProjectInformation = try x509Cert.expoProjectInformation()
        if lastExpoProjectInformation != nil && lastExpoProjectInformation != currProjectInformation {
          throw CodeSigningError.CertificateProjectInformationChainError
        }
        lastExpoProjectInformation = currProjectInformation
      }
    }
  }
}

private extension SecTrust {
  static func create(certificates: [SecCertificate], policy: SecPolicy) throws -> SecTrust {
    var optionalTrust: SecTrust?
    let status = SecTrustCreateWithCertificates(certificates as AnyObject, policy, &optionalTrust)
    guard let trust = optionalTrust, status.isSuccess else {
      throw CodeSigningError.CertificateChainError(reason: .couldNotCreateSecTrust(osStatus: status))
    }
    return trust
  }

  func setAnchorCertificates(_ anchorCertificates: [SecCertificate]) throws {
    let status = SecTrustSetAnchorCertificates(self, anchorCertificates as CFArray)
    guard status.isSuccess else {
      throw CodeSigningError.CertificateChainError(reason: .couldNotSetAnchorOnSecTrust(osStatus: status))
    }

    let status2 = SecTrustSetAnchorCertificatesOnly(self, true)
    guard status2.isSuccess else {
      throw CodeSigningError.CertificateChainError(reason: .couldNotSetAnchorOnlySettingOnSecTrust(osStatus: status2))
    }
  }

  func disableNetwork() throws {
    let status = SecTrustSetNetworkFetchAllowed(self, false)
    guard status.isSuccess else {
      throw CodeSigningError.CertificateChainError(reason: .couldNotDisableNetworkFetchOnSecTrust(osStatus: status))
    }
  }

  func evaluate() throws {
    var error: CFError?
    let success = SecTrustEvaluateWithError(self, &error)
    if !success {
      throw CodeSigningError.CertificateChainError(reason: .secTrustEvaluationError(cause: error))
    }
  }
}

// swiftlint:enable force_unwrapping
// swiftlint:enable identifier_name
