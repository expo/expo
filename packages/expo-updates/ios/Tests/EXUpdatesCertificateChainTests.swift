//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class EXUpdatesCertificateChainTests : XCTestCase {
  func test_ValidSingleCertificate() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let codeSigningCertificate = try EXUpdatesCertificateChain(certificateStrings: [cert]).codeSigningCertificate()
    XCTAssertNotNil(codeSigningCertificate)
    XCTAssertNil(try codeSigningCertificate.1.expoProjectInformation())
  }
  
  func test_ValidCertificateChain() throws {
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainRoot)
    let codeSigningCertificate = try EXUpdatesCertificateChain(certificateStrings: [leafCert, intermediateCert, rootCert]).codeSigningCertificate()
    XCTAssertNotNil(codeSigningCertificate)
    let expoProjectInformation = try codeSigningCertificate.1.expoProjectInformation()
    XCTAssertEqual(expoProjectInformation?.scopeKey, "@test/app")
    XCTAssertEqual(expoProjectInformation?.projectId, "285dc9ca-a25d-4f60-93be-36dc312266d7")
  }
  
  func test_RequiresLengthGreaterThanZero() throws {
    XCTAssertThrowsError(try EXUpdatesCertificateChain(certificateStrings: []).codeSigningCertificate()) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.CertificateEmptyError)
    }
  }
  
  func test_ThrowsWhenAnyCertificateIsInvalidDate() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.validityExpired)
    XCTAssertThrowsError(try EXUpdatesCertificateChain(certificateStrings: [cert]).codeSigningCertificate()) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.CertificateValidityError)
    }
  }
  
  func test_ThrowsWhenLeafIsNotCodeSigningNoKeyUsage() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.noKeyUsage)
    XCTAssertThrowsError(try EXUpdatesCertificateChain(certificateStrings: [cert]).codeSigningCertificate()) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.CertificateMissingCodeSigningError)
    }
  }
  
  func test_ThrowsWhenLeafIsNotCodeSigningNoCodeSigningExtendedKeyUsage() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.noCodeSigningExtendedUsage)
    XCTAssertThrowsError(try EXUpdatesCertificateChain(certificateStrings: [cert]).codeSigningCertificate()) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.CertificateMissingCodeSigningError)
    }
  }
  
  func test_ThrowsChainIsNotValid() throws {
    // missing intermediate
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainRoot)
    
    XCTAssertThrowsError(try EXUpdatesCertificateChain(certificateStrings: [leafCert, rootCert]).codeSigningCertificate()) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.CertificateChainError)
    }
  }
  
  func test_ThrowsWhenAnySignatureInvalid() throws {
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.invalidSignatureChainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainRoot)
    
    XCTAssertThrowsError(try EXUpdatesCertificateChain(certificateStrings: [leafCert, intermediateCert, rootCert]).codeSigningCertificate()) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.CertificateChainError)
    }
  }
  
  func test_ThrowsWhenRootIsNotSelfSigned() throws {
    // missing root, meaning intermediate is considered root and is not self-signed
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    
    XCTAssertThrowsError(try EXUpdatesCertificateChain(certificateStrings: [leafCert, intermediateCert]).codeSigningCertificate()) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.CertificateRootNotSelfSigned)
    }
  }
  
  // iOS doesn't provide a way to verify signature of any root cert (including self-signed), only certs up to root cert
  func skip_test_ThrowsWhenRootSignatureInvalid() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.signatureInvalid)
    XCTAssertThrowsError(try EXUpdatesCertificateChain(certificateStrings: [cert]).codeSigningCertificate()) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.CertificateChainError)
    }
  }
  
  func test_ThrowsWhenIntermediateCANotCA() throws {
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainNotCALeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainNotCAIntermediate)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainNotCARoot)
    
    XCTAssertThrowsError(try EXUpdatesCertificateChain(certificateStrings: [leafCert, intermediateCert, rootCert]).codeSigningCertificate()) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.CertificateChainError)
    }
  }
  
  func test_ThrowsWhenCAPathLenViolated() throws {
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainPathLenViolationLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainPathLenViolationIntermediate)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainPathLenViolationRoot)
    
    XCTAssertThrowsError(try EXUpdatesCertificateChain(certificateStrings: [leafCert, intermediateCert, rootCert]).codeSigningCertificate()) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.CertificateChainError)
    }
  }
  
  func test_ThrowsWhenExpoProjectInformationViolation() throws {
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainExpoProjectInformationViolationLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainExpoProjectInformationViolationIntermediate)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainExpoProjectInformationViolationRoot)
    
    XCTAssertThrowsError(try EXUpdatesCertificateChain(certificateStrings: [leafCert, intermediateCert, rootCert]).codeSigningCertificate()) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.CertificateProjectInformationChainError)
    }
  }
}
