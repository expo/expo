//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class EXUpdatesCodeSigningConfigurationTests : XCTestCase {
  func test_separateCertificateChain() throws {
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainRoot)
    
    let testCert = try TestHelper.getTestCertificate(TestCertificate.test)
    
    let chain1 = EXUpdatesCodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert)
    XCTAssertEqual(1, chain1.count)
    
    let chain2 = EXUpdatesCodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert + intermediateCert)
    XCTAssertEqual(2, chain2.count)
    
    let chain3 = EXUpdatesCodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert + intermediateCert + rootCert)
    XCTAssertEqual(3, chain3.count)
    
    let chainWithABunchOfNewlinesAndStuff  = EXUpdatesCodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: testCert + "\n\n\n\n" + testCert)
    XCTAssertEqual(2, chainWithABunchOfNewlinesAndStuff.count)
  }
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderDefaultValues() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [:],
                                                              includeManifestResponseCertificateChain: false)
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, "sig, keyid=\"root\", alg=\"rsa-v1_5-sha256\"")
  }
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderValuesFromConfig() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey: EXUpdatesCodeSigningAlgorithm.RSA_SHA256.rawValue,
                                                                         EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                              includeManifestResponseCertificateChain: false)
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, "sig, keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
  }
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderEscapedValues() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey: EXUpdatesCodeSigningAlgorithm.RSA_SHA256.rawValue,
                                                                         EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: #"test"hello\"#],
                                                              includeManifestResponseCertificateChain: false)
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, #"sig, keyid="test\"hello\\", alg="rsa-v1_5-sha256""#)
  }
  
  func test_createAcceptSignatureHeader_ThrowsInvalidAlg() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    XCTAssertThrowsError(try EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                               metadata: [EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey: "fake",
                                                                          EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                               includeManifestResponseCertificateChain: false)) { error in
    XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.AlgorithmParseError)
    }
  }
  
  func test_validateSignature_Valid() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [:],
                                                              includeManifestResponseCertificateChain: false)
    let codeSigningInfo = try EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: TestHelper.testSignature)
    let isValid = try configuration.validateSignature(signatureHeaderInfo: codeSigningInfo, signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: nil)
    XCTAssertTrue(isValid.boolValue)
  }
  
  func test_validateSignature_ReturnsFalseWhenSignatureIsInvalid() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert, metadata: [:], includeManifestResponseCertificateChain: false)
    let codeSigningInfo = try EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"aGVsbG8=\"")
    let isValid = try configuration.validateSignature(signatureHeaderInfo: codeSigningInfo, signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: nil)
    XCTAssertFalse(isValid.boolValue)
  }
  
  func test_validateSignature_ThrowsWhenKeyDoesNotMatch() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                              includeManifestResponseCertificateChain: false)
    let codeSigningInfo = try EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"aGVsbG8=\", keyid=\"other\"")
    XCTAssertThrowsError(try configuration.validateSignature(signatureHeaderInfo: codeSigningInfo, signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: nil)) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.KeyIdMismatchError)
    }
  }
    
  func test_validateSignature_DoesNotUseChainInManifestResponseIfFlagIsFalse() throws {
    let testCert = try TestHelper.getTestCertificate(TestCertificate.test)
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    let configuration = try EXUpdatesCodeSigningConfiguration(embeddedCertificateString: testCert,
                                                              metadata: [:],
                                                              includeManifestResponseCertificateChain: false)
    let codeSigningInfo = try EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: TestHelper.testSignature)
    let isValid = try configuration.validateSignature(signatureHeaderInfo: codeSigningInfo, signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: leafCert + intermediateCert)
    XCTAssertTrue(isValid.boolValue)
  }
    
  func test_validateSignature_DoesUseChainInManifestResponseIfFlagIsTrue() throws {
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainRoot)
    let configuration = try EXUpdatesCodeSigningConfiguration(embeddedCertificateString: rootCert,
                                                              metadata: [EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "ca-root"],
                                                              includeManifestResponseCertificateChain: true)
    let codeSigningInfo = try EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: TestHelper.testValidChainLeafSignature)
    let isValid = try configuration.validateSignature(signatureHeaderInfo: codeSigningInfo, signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: leafCert + intermediateCert)
    XCTAssertTrue(isValid.boolValue)
  }
}
