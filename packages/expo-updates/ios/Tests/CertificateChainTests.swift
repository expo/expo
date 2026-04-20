//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("CertificateChain")
struct CertificateChainTests {
  @Test
  func `works for valid single certificate`() throws {
    let cert = getTestCertificate(TestCertificate.test)
    let codeSigningCertificate = try CertificateChain(certificateStrings: [cert]).codeSigningCertificate()
    #expect(codeSigningCertificate.0 != nil)
    #expect(try codeSigningCertificate.1.expoProjectInformation() == nil)
  }

  @Test
  func `works for valid certificate chain`() throws {
    let leafCert = getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = getTestCertificate(TestCertificate.chainIntermediate)
    let rootCert = getTestCertificate(TestCertificate.chainRoot)
    let codeSigningCertificate = try CertificateChain(certificateStrings: [leafCert, intermediateCert, rootCert]).codeSigningCertificate()
    #expect(codeSigningCertificate.0 != nil)
    let expoProjectInformation = try codeSigningCertificate.1.expoProjectInformation()
    #expect(expoProjectInformation?.scopeKey == "@test/app")
    #expect(expoProjectInformation?.projectId == "285dc9ca-a25d-4f60-93be-36dc312266d7")
  }

  @Test
  func `requires length > 0`() {
    #expect {
      try CertificateChain(certificateStrings: []).codeSigningCertificate()
    } throws: { error in
      guard case CodeSigningError.CertificateEmptyError = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws when any certificate is invalid date`() {
    let cert = getTestCertificate(TestCertificate.validityExpired)
    #expect {
      try CertificateChain(certificateStrings: [cert]).codeSigningCertificate()
    } throws: { error in
      guard case CodeSigningError.CertificateValidityError = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws when leaf is not code signing no key usage`() {
    let cert = getTestCertificate(TestCertificate.noKeyUsage)
    #expect {
      try CertificateChain(certificateStrings: [cert]).codeSigningCertificate()
    } throws: { error in
      guard case CodeSigningError.CertificateMissingCodeSigningError = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws when leaf is not code signing no code signing extended key usage`() {
    let cert = getTestCertificate(TestCertificate.noCodeSigningExtendedUsage)
    #expect {
      try CertificateChain(certificateStrings: [cert]).codeSigningCertificate()
    } throws: { error in
      guard case CodeSigningError.CertificateMissingCodeSigningError = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws chain is not valid`() {
    // missing intermediate
    let leafCert = getTestCertificate(TestCertificate.chainLeaf)
    let rootCert = getTestCertificate(TestCertificate.chainRoot)
    #expect {
      try CertificateChain(certificateStrings: [leafCert, rootCert]).codeSigningCertificate()
    } throws: { error in
      guard case CodeSigningError.CertificateChainError = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws when any signature is invalid`() {
    let leafCert = getTestCertificate(TestCertificate.invalidSignatureChainLeaf)
    let intermediateCert = getTestCertificate(TestCertificate.chainIntermediate)
    let rootCert = getTestCertificate(TestCertificate.chainRoot)

    #expect {
      try CertificateChain(certificateStrings: [leafCert, intermediateCert, rootCert]).codeSigningCertificate()
    } throws: { error in
      guard case CodeSigningError.CertificateChainError = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws when root is not self signed`() {
    // missing root, meaning intermediate is considered root and is not self-signed
    let leafCert = getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = getTestCertificate(TestCertificate.chainIntermediate)

    #expect {
      try CertificateChain(certificateStrings: [leafCert, intermediateCert]).codeSigningCertificate()
    } throws: { error in
      guard case CodeSigningError.CertificateRootNotSelfSigned = error else {
        return false
      }
      return true
    }
  }

  // iOS doesn't provide a way to verify signature of any root cert (including self-signed), only certs up to root cert
  @Test(.disabled("iOS doesn't provide a way to verify signature of any root cert"))
  func `throws when root signature is invalid`() {
    let cert = getTestCertificate(TestCertificate.signatureInvalid)

    #expect {
      try CertificateChain(certificateStrings: [cert]).codeSigningCertificate()
    } throws: { error in
      guard case CodeSigningError.CertificateChainError = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws when intermediate CA not CA`() {
    let leafCert = getTestCertificate(TestCertificate.chainNotCALeaf)
    let intermediateCert = getTestCertificate(TestCertificate.chainNotCAIntermediate)
    let rootCert = getTestCertificate(TestCertificate.chainNotCARoot)

    #expect {
      try CertificateChain(certificateStrings: [leafCert, intermediateCert, rootCert]).codeSigningCertificate()
    } throws: { error in
      guard case CodeSigningError.CertificateChainError = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws when CA path len violated`() {
    let leafCert = getTestCertificate(TestCertificate.chainPathLenViolationLeaf)
    let intermediateCert = getTestCertificate(TestCertificate.chainPathLenViolationIntermediate)
    let rootCert = getTestCertificate(TestCertificate.chainPathLenViolationRoot)

    #expect {
      try CertificateChain(certificateStrings: [leafCert, intermediateCert, rootCert]).codeSigningCertificate()
    } throws: { error in
      guard case CodeSigningError.CertificateChainError = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws when expo project information violation`() {
    let leafCert = getTestCertificate(TestCertificate.chainExpoProjectInformationViolationLeaf)
    let intermediateCert = getTestCertificate(TestCertificate.chainExpoProjectInformationViolationIntermediate)
    let rootCert = getTestCertificate(TestCertificate.chainExpoProjectInformationViolationRoot)

    #expect {
      try CertificateChain(certificateStrings: [leafCert, intermediateCert, rootCert]).codeSigningCertificate()
    } throws: { error in
      guard case CodeSigningError.CertificateProjectInformationChainError = error else {
        return false
      }
      return true
    }
  }
}
