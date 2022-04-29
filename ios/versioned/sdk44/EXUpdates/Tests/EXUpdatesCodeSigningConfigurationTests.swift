//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import ABI44_0_0EXUpdates

class ABI44_0_0EXUpdatesCodeSigningConfigurationTests : XCTestCase {
  func test_separateCertificateChain() throws {
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainRoot)
    
    let testCert = try TestHelper.getTestCertificate(TestCertificate.test)
    
    let chain1 = ABI44_0_0EXUpdatesCodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert)
    XCTAssertEqual(1, chain1.count)
    
    let chain2 = ABI44_0_0EXUpdatesCodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert + intermediateCert)
    XCTAssertEqual(2, chain2.count)
    
    let chain3 = ABI44_0_0EXUpdatesCodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert + intermediateCert + rootCert)
    XCTAssertEqual(3, chain3.count)
    
    let chainWithABunchOfNewlinesAndStuff  = ABI44_0_0EXUpdatesCodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: testCert + "\n\n\n\n" + testCert)
    XCTAssertEqual(2, chainWithABunchOfNewlinesAndStuff.count)
  }
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderDefaultValues() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try ABI44_0_0EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [:],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, "sig, keyid=\"root\", alg=\"rsa-v1_5-sha256\"")
  }
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderValuesFromConfig() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try ABI44_0_0EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [ABI44_0_0EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey: ABI44_0_0EXUpdatesCodeSigningAlgorithm.RSA_SHA256.rawValue,
                                                                         ABI44_0_0EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, "sig, keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
  }
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderEscapedValues() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try ABI44_0_0EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [ABI44_0_0EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey: ABI44_0_0EXUpdatesCodeSigningAlgorithm.RSA_SHA256.rawValue,
                                                                         ABI44_0_0EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: #"test"hello\"#],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, #"sig, keyid="test\"hello\\", alg="rsa-v1_5-sha256""#)
  }
  
  func test_createAcceptSignatureHeader_ThrowsInvalidAlg() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    XCTAssertThrowsError(try ABI44_0_0EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                               metadata: [ABI44_0_0EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey: "fake",
                                                                          ABI44_0_0EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                               includeManifestResponseCertificateChain: false,
                                                               allowUnsignedManifests: false)) { error in
      XCTAssertEqual(error as? ABI44_0_0EXUpdatesCodeSigningError, ABI44_0_0EXUpdatesCodeSigningError.AlgorithmParseError)
    }
  }
  
  func test_validateSignature_Valid() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try ABI44_0_0EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [:],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureValidationResult = try configuration.validateSignature(signature: TestHelper.testSignature,
                                                                        signedData: TestHelper.testBody.data(using: .utf8)!,
                                                                        manifestResponseCertificateChain: nil)
    XCTAssertEqual(signatureValidationResult.validationResult, ABI44_0_0EXUpdatesValidationResult.Valid)
    XCTAssertNil(signatureValidationResult.expoProjectInformation)
  }
  
  func test_validateSignature_ReturnsFalseWhenSignatureIsInvalid() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try ABI44_0_0EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [:],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureValidationResult = try configuration.validateSignature(signature: "sig=\"aGVsbG8=\"", signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: nil)
    XCTAssertEqual(signatureValidationResult.validationResult, ABI44_0_0EXUpdatesValidationResult.Invalid)
    XCTAssertNil(signatureValidationResult.expoProjectInformation)
  }
  
  func test_validateSignature_ThrowsWhenKeyDoesNotMatch() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try ABI44_0_0EXUpdatesCodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [ABI44_0_0EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    XCTAssertThrowsError(try configuration.validateSignature(signature: "sig=\"aGVsbG8=\", keyid=\"other\"", signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: nil)) { error in
      XCTAssertEqual(error as? ABI44_0_0EXUpdatesCodeSigningError, ABI44_0_0EXUpdatesCodeSigningError.KeyIdMismatchError)
    }
  }
    
  func test_validateSignature_DoesNotUseChainInManifestResponseIfFlagIsFalse() throws {
    let testCert = try TestHelper.getTestCertificate(TestCertificate.test)
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    let configuration = try ABI44_0_0EXUpdatesCodeSigningConfiguration(embeddedCertificateString: testCert,
                                                              metadata: [:],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureValidationResult = try configuration.validateSignature(signature: TestHelper.testSignature, signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: leafCert + intermediateCert)
    XCTAssertEqual(signatureValidationResult.validationResult, ABI44_0_0EXUpdatesValidationResult.Valid)
    XCTAssertNil(signatureValidationResult.expoProjectInformation)
  }
    
  func test_validateSignature_DoesUseChainInManifestResponseIfFlagIsTrue() throws {
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainRoot)
    let configuration = try ABI44_0_0EXUpdatesCodeSigningConfiguration(embeddedCertificateString: rootCert,
                                                              metadata: [ABI44_0_0EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "ca-root"],
                                                              includeManifestResponseCertificateChain: true,
                                                              allowUnsignedManifests: false)
    let signatureValidationResult = try configuration.validateSignature(signature: TestHelper.testValidChainLeafSignature, signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: leafCert + intermediateCert)
    XCTAssertEqual(signatureValidationResult.validationResult, ABI44_0_0EXUpdatesValidationResult.Valid)
    let expoProjectInformation = signatureValidationResult.expoProjectInformation
    XCTAssertEqual(expoProjectInformation?.scopeKey, "@test/app")
    XCTAssertEqual(expoProjectInformation?.projectId, "285dc9ca-a25d-4f60-93be-36dc312266d7")
  }
  
  func test_validateSignature_AllowsUnsignedManifestIfAllowUnsignedFlagIsTrue() throws {
    let testCert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try ABI44_0_0EXUpdatesCodeSigningConfiguration(embeddedCertificateString: testCert,
                                                              metadata: [ABI44_0_0EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                              includeManifestResponseCertificateChain: true,
                                                              allowUnsignedManifests: true)
    let signatureValidationResult = try configuration.validateSignature(signature: nil, signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: nil)
    XCTAssertEqual(signatureValidationResult.validationResult, ABI44_0_0EXUpdatesValidationResult.Skipped)
    XCTAssertNil(signatureValidationResult.expoProjectInformation)
  }
                                                                         
  func test_validateSignature_ChecksSignedManifestIfAllowUnsignedFlagIsTrueButSignatureIsProvided() throws {
    let testCert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try ABI44_0_0EXUpdatesCodeSigningConfiguration(embeddedCertificateString: testCert,
                                                             metadata: [ABI44_0_0EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                             includeManifestResponseCertificateChain: true,
                                                             allowUnsignedManifests: true)
    let signatureValidationResult = try configuration.validateSignature(signature: "sig=\"aGVsbG8=\"", signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: nil)
    XCTAssertEqual(signatureValidationResult.validationResult, ABI44_0_0EXUpdatesValidationResult.Invalid)
    XCTAssertNil(signatureValidationResult.expoProjectInformation)
  }
}
