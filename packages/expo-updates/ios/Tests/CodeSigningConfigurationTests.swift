//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class CodeSigningConfigurationTests : XCTestCase {
  func test_separateCertificateChain() throws {
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainRoot)
    
    let testCert = try TestHelper.getTestCertificate(TestCertificate.test)
    
    let chain1 = CodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert)
    XCTAssertEqual(1, chain1.count)
    
    let chain2 = CodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert + intermediateCert)
    XCTAssertEqual(2, chain2.count)
    
    let chain3 = CodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert + intermediateCert + rootCert)
    XCTAssertEqual(3, chain3.count)
    
    let chainWithABunchOfNewlinesAndStuff  = CodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: testCert + "\n\n\n\n" + testCert)
    XCTAssertEqual(2, chainWithABunchOfNewlinesAndStuff.count)
  }
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderDefaultValues() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try CodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [:],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, "sig, keyid=\"root\", alg=\"rsa-v1_5-sha256\"")
  }
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderValuesFromConfig() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try CodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [CodeSigningMetadataFields.AlgorithmFieldKey: CodeSigningAlgorithm.RSA_SHA256.rawValue,
                                                                         CodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, "sig, keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
  }
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderEscapedValues() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try CodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [CodeSigningMetadataFields.AlgorithmFieldKey: CodeSigningAlgorithm.RSA_SHA256.rawValue,
                                                                         CodeSigningMetadataFields.KeyIdFieldKey: #"test"hello\"#],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, #"sig, keyid="test\"hello\\", alg="rsa-v1_5-sha256""#)
  }
  
  func test_createAcceptSignatureHeader_ThrowsInvalidAlg() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    XCTAssertThrowsError(try CodeSigningConfiguration(embeddedCertificateString: cert,
                                                               metadata: [CodeSigningMetadataFields.AlgorithmFieldKey: "fake",
                                                                          CodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                               includeManifestResponseCertificateChain: false,
                                                               allowUnsignedManifests: false)) { error in
      XCTAssertEqual(error as? CodeSigningError, CodeSigningError.AlgorithmParseError)
    }
  }
  
  func test_validateSignature_Valid() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try CodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [:],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureValidationResult = try configuration.validateSignature(signature: TestHelper.testSignature,
                                                                        signedData: TestHelper.testBody.data(using: .utf8)!,
                                                                        manifestResponseCertificateChain: nil)
    XCTAssertEqual(signatureValidationResult.validationResult, ValidationResult.valid)
    XCTAssertNil(signatureValidationResult.expoProjectInformation)
  }
  
  func test_validateSignature_ReturnsFalseWhenSignatureIsInvalid() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try CodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [:],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureValidationResult = try configuration.validateSignature(signature: "sig=\"aGVsbG8=\"", signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: nil)
    XCTAssertEqual(signatureValidationResult.validationResult, ValidationResult.invalid)
    XCTAssertNil(signatureValidationResult.expoProjectInformation)
  }
  
  func test_validateSignature_ThrowsWhenKeyDoesNotMatch() throws {
    let cert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try CodeSigningConfiguration(embeddedCertificateString: cert,
                                                              metadata: [CodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    XCTAssertThrowsError(try configuration.validateSignature(signature: "sig=\"aGVsbG8=\", keyid=\"other\"", signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: nil)) { error in
      XCTAssertEqual(error as? CodeSigningError, CodeSigningError.KeyIdMismatchError)
    }
  }
    
  func test_validateSignature_DoesNotUseChainInManifestResponseIfFlagIsFalse() throws {
    let testCert = try TestHelper.getTestCertificate(TestCertificate.test)
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    let configuration = try CodeSigningConfiguration(embeddedCertificateString: testCert,
                                                              metadata: [:],
                                                              includeManifestResponseCertificateChain: false,
                                                              allowUnsignedManifests: false)
    let signatureValidationResult = try configuration.validateSignature(signature: TestHelper.testSignature, signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: leafCert + intermediateCert)
    XCTAssertEqual(signatureValidationResult.validationResult, ValidationResult.valid)
    XCTAssertNil(signatureValidationResult.expoProjectInformation)
  }
    
  func test_validateSignature_DoesUseChainInManifestResponseIfFlagIsTrue() throws {
    let leafCert = try TestHelper.getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = try TestHelper.getTestCertificate(TestCertificate.chainIntermediate)
    let rootCert = try TestHelper.getTestCertificate(TestCertificate.chainRoot)
    let configuration = try CodeSigningConfiguration(embeddedCertificateString: rootCert,
                                                              metadata: [CodeSigningMetadataFields.KeyIdFieldKey: "ca-root"],
                                                              includeManifestResponseCertificateChain: true,
                                                              allowUnsignedManifests: false)
    let signatureValidationResult = try configuration.validateSignature(signature: TestHelper.testValidChainLeafSignature, signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: leafCert + intermediateCert)
    XCTAssertEqual(signatureValidationResult.validationResult, ValidationResult.valid)
    let expoProjectInformation = signatureValidationResult.expoProjectInformation
    XCTAssertEqual(expoProjectInformation?.scopeKey, "@test/app")
    XCTAssertEqual(expoProjectInformation?.projectId, "285dc9ca-a25d-4f60-93be-36dc312266d7")
  }
  
  func test_validateSignature_AllowsUnsignedManifestIfAllowUnsignedFlagIsTrue() throws {
    let testCert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try CodeSigningConfiguration(embeddedCertificateString: testCert,
                                                              metadata: [CodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                              includeManifestResponseCertificateChain: true,
                                                              allowUnsignedManifests: true)
    let signatureValidationResult = try configuration.validateSignature(signature: nil, signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: nil)
    XCTAssertEqual(signatureValidationResult.validationResult, ValidationResult.skipped)
    XCTAssertNil(signatureValidationResult.expoProjectInformation)
  }
                                                                         
  func test_validateSignature_ChecksSignedManifestIfAllowUnsignedFlagIsTrueButSignatureIsProvided() throws {
    let testCert = try TestHelper.getTestCertificate(TestCertificate.test)
    let configuration = try CodeSigningConfiguration(embeddedCertificateString: testCert,
                                                             metadata: [CodeSigningMetadataFields.KeyIdFieldKey: "test"],
                                                             includeManifestResponseCertificateChain: true,
                                                             allowUnsignedManifests: true)
    let signatureValidationResult = try configuration.validateSignature(signature: "sig=\"aGVsbG8=\"", signedData: TestHelper.testBody.data(using: .utf8)!, manifestResponseCertificateChain: nil)
    XCTAssertEqual(signatureValidationResult.validationResult, ValidationResult.invalid)
    XCTAssertNil(signatureValidationResult.expoProjectInformation)
  }
}
