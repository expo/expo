//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("CodeSigningConfiguration")
@MainActor
struct CodeSigningConfigurationTests {
  @Test
  func `works with separate certificate chain`() {
    let leafCert = getTestCertificate(TestCertificate.chainLeaf)
    let intermediateCert = getTestCertificate(TestCertificate.chainIntermediate)
    let rootCert = getTestCertificate(TestCertificate.chainRoot)

    let testCert = getTestCertificate(TestCertificate.test)

    let chain1 = CodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert)
    #expect(chain1.count == 1)

    let chain2 = CodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert + intermediateCert)
    #expect(chain2.count == 2)

    let chain3 = CodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert + intermediateCert + rootCert)
    #expect(chain3.count == 3)

    let chainWithABunchOfNewlinesAndStuff = CodeSigningConfiguration.separateCertificateChain(
      certificateChainInManifestResponse: testCert + "\n\n\n\n" + testCert
    )
    #expect(chainWithABunchOfNewlinesAndStuff.count == 2)
  }

  // MARK: - createAcceptSignatureHeader

  @Suite("createAcceptSignatureHeader")
  @MainActor
  struct CreateAcceptSignatureHeaderTests {
    @Test
    func `creates signature header default values`() throws {
      let cert = getTestCertificate(TestCertificate.test)
      let configuration = try CodeSigningConfiguration(
        embeddedCertificateString: cert,
        metadata: [:],
        includeManifestResponseCertificateChain: false,
        allowUnsignedManifests: false
      )
      let signatureHeader = configuration.createAcceptSignatureHeader()
      #expect(signatureHeader == "sig, keyid=\"root\", alg=\"rsa-v1_5-sha256\"")
    }

    @Test
    func `creates signature header values from config`() throws {
      let cert = getTestCertificate(TestCertificate.test)
      let configuration = try CodeSigningConfiguration(
        embeddedCertificateString: cert,
        metadata: [
          CodeSigningMetadataFields.AlgorithmFieldKey: CodeSigningAlgorithm.RSA_SHA256.rawValue,
          CodeSigningMetadataFields.KeyIdFieldKey: "test"
        ],
        includeManifestResponseCertificateChain: false,
        allowUnsignedManifests: false
      )
      let signatureHeader = configuration.createAcceptSignatureHeader()
      #expect(signatureHeader == "sig, keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
    }

    @Test
    func `creates signature header escaped values`() throws {
      let cert = getTestCertificate(TestCertificate.test)
      let configuration = try CodeSigningConfiguration(
        embeddedCertificateString: cert,
        metadata: [
          CodeSigningMetadataFields.AlgorithmFieldKey: CodeSigningAlgorithm.RSA_SHA256.rawValue,
          CodeSigningMetadataFields.KeyIdFieldKey: #"test"hello\"#
        ],
        includeManifestResponseCertificateChain: false,
        allowUnsignedManifests: false
      )
      let signatureHeader = configuration.createAcceptSignatureHeader()
      #expect(signatureHeader == #"sig, keyid="test\"hello\\", alg="rsa-v1_5-sha256""#)
    }

    @Test
    func `creates signature header throws invalid arg`() {
      let cert = getTestCertificate(TestCertificate.test)
      #expect {
        try CodeSigningConfiguration(
          embeddedCertificateString: cert,
          metadata: [
            CodeSigningMetadataFields.AlgorithmFieldKey: "fake",
            CodeSigningMetadataFields.KeyIdFieldKey: "test"
          ],
          includeManifestResponseCertificateChain: false,
          allowUnsignedManifests: false)
      } throws: { error in
        guard case CodeSigningError.AlgorithmParseError = error else {
          return false
        }
        return true
      }
    }
  }

  // MARK: - validateSignature

  @Suite("validateSignature")
  @MainActor
  struct ValidateSignatureTests {
    @Test
    func `works for valid case`() throws {
      let cert = getTestCertificate(TestCertificate.test)
      let logger = UpdatesLogger()
      let configuration = try CodeSigningConfiguration(
        embeddedCertificateString: cert,
        metadata: [:],
        includeManifestResponseCertificateChain: false,
        allowUnsignedManifests: false
      )
      let signatureValidationResult = try configuration.validateSignature(
        logger: logger,
        signature: CertificateFixtures.testExpoUpdatesManifestBodySignature,
        signedData: CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!,
        manifestResponseCertificateChain: nil
      )
      #expect(signatureValidationResult.validationResult == ValidationResult.valid)
      #expect(signatureValidationResult.expoProjectInformation == nil)
    }

    @Test
    func `returns false when signature is invalid`() throws {
      let cert = getTestCertificate(TestCertificate.test)
      let logger = UpdatesLogger()
      let configuration = try CodeSigningConfiguration(
        embeddedCertificateString: cert,
        metadata: [:],
        includeManifestResponseCertificateChain: false,
        allowUnsignedManifests: false
      )
      let signatureValidationResult = try configuration.validateSignature(
        logger: logger,
        signature: "sig=\"aGVsbG8=\"",
        signedData: CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!,
        manifestResponseCertificateChain: nil
      )
      #expect(signatureValidationResult.validationResult == ValidationResult.invalid)
      #expect(signatureValidationResult.expoProjectInformation == nil)
    }

    @Test
    func `throws when key does not match`() throws {
      let logger = UpdatesLogger()
      let cert = getTestCertificate(TestCertificate.test)
      let configuration = try CodeSigningConfiguration(
        embeddedCertificateString: cert,
        metadata: [CodeSigningMetadataFields.KeyIdFieldKey: "test"],
        includeManifestResponseCertificateChain: false,
        allowUnsignedManifests: false
      )
      #expect {
        try configuration.validateSignature(
          logger: logger,
          signature: "sig=\"aGVsbG8=\", keyid=\"other\"",
          signedData: CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!,
          manifestResponseCertificateChain: nil
        )
      } throws: { error in
        guard case CodeSigningError.KeyIdMismatchError = error else {
          return false
        }
        return true
      }
    }

    @Test
    func `does not use chain in manifest response if flag is false`() throws {
      let logger = UpdatesLogger()
      let testCert = getTestCertificate(TestCertificate.test)
      let leafCert = getTestCertificate(TestCertificate.chainLeaf)
      let intermediateCert = getTestCertificate(TestCertificate.chainIntermediate)
      let configuration = try CodeSigningConfiguration(
        embeddedCertificateString: testCert,
        metadata: [:],
        includeManifestResponseCertificateChain: false,
        allowUnsignedManifests: false
      )
      let signatureValidationResult = try configuration.validateSignature(
        logger: logger,
        signature: CertificateFixtures.testExpoUpdatesManifestBodySignature,
        signedData: CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!,
        manifestResponseCertificateChain: leafCert + intermediateCert
      )
      #expect(signatureValidationResult.validationResult == ValidationResult.valid)
      #expect(signatureValidationResult.expoProjectInformation == nil)
    }

    @Test
    func `does use chain in manifest response if flag is true`() throws {
      let logger = UpdatesLogger()
      let leafCert = getTestCertificate(TestCertificate.chainLeaf)
      let intermediateCert = getTestCertificate(TestCertificate.chainIntermediate)
      let rootCert = getTestCertificate(TestCertificate.chainRoot)
      let configuration = try CodeSigningConfiguration(
        embeddedCertificateString: rootCert,
        metadata: [CodeSigningMetadataFields.KeyIdFieldKey: "ca-root"],
        includeManifestResponseCertificateChain: true,
        allowUnsignedManifests: false
      )
      let signatureValidationResult = try configuration.validateSignature(
        logger: logger,
        signature: CertificateFixtures.testExpoUpdatesManifestBodyValidChainLeafSignature,
        signedData: CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!,
        manifestResponseCertificateChain: leafCert + intermediateCert
      )
      #expect(signatureValidationResult.validationResult == ValidationResult.valid)

      let expoProjectInformation = signatureValidationResult.expoProjectInformation
      #expect(expoProjectInformation?.scopeKey == "@test/app")
      #expect(expoProjectInformation?.projectId == "285dc9ca-a25d-4f60-93be-36dc312266d7")
    }

    @Test
    func `AllowsUnsignedManifestIfAllowUnsignedFlagIsTrue`() throws {
      let logger = UpdatesLogger()
      let testCert = getTestCertificate(TestCertificate.test)
      let configuration = try CodeSigningConfiguration(
        embeddedCertificateString: testCert,
        metadata: [CodeSigningMetadataFields.KeyIdFieldKey: "test"],
        includeManifestResponseCertificateChain: true,
        allowUnsignedManifests: true
      )
      let signatureValidationResult = try configuration.validateSignature(
        logger: logger,
        signature: nil,
        signedData: CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!,
        manifestResponseCertificateChain: nil
      )
      #expect(signatureValidationResult.validationResult == ValidationResult.skipped)
      #expect(signatureValidationResult.expoProjectInformation == nil)
    }

    @Test
    func `ChecksSignedManifestIfAllowUnsignedFlagIsTrueButSignatureIsProvided`() throws {
      let logger = UpdatesLogger()
      let testCert = getTestCertificate(TestCertificate.test)
      let configuration = try CodeSigningConfiguration(
        embeddedCertificateString: testCert,
        metadata: [CodeSigningMetadataFields.KeyIdFieldKey: "test"],
        includeManifestResponseCertificateChain: true,
        allowUnsignedManifests: true
      )
      let signatureValidationResult = try configuration.validateSignature(
        logger: logger,
        signature: "sig=\"aGVsbG8=\"",
        signedData: CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!,
        manifestResponseCertificateChain: nil
      )
      #expect(signatureValidationResult.validationResult == ValidationResult.invalid)
      #expect(signatureValidationResult.expoProjectInformation == nil)
    }
  }
}
