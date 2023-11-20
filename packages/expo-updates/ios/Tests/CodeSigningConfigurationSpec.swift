//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

class CodeSigningConfigurationSpec : ExpoSpec {
  override class func spec() {
    it("works with spearate certificate chain") {
      let leafCert = getTestCertificate(TestCertificate.chainLeaf)
      let intermediateCert = getTestCertificate(TestCertificate.chainIntermediate)
      let rootCert = getTestCertificate(TestCertificate.chainRoot)

      let testCert = getTestCertificate(TestCertificate.test)

      let chain1 = CodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert)
      expect(chain1.count) == 1

      let chain2 = CodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert + intermediateCert)
      expect(chain2.count) == 2

      let chain3 = CodeSigningConfiguration.separateCertificateChain(certificateChainInManifestResponse: leafCert + intermediateCert + rootCert)
      expect(chain3.count) == 3

      let chainWithABunchOfNewlinesAndStuff  = CodeSigningConfiguration.separateCertificateChain(
        certificateChainInManifestResponse: testCert + "\n\n\n\n" + testCert
      )
      expect(chainWithABunchOfNewlinesAndStuff.count) == 2
    }

    describe("createAcceptSignatureHeader") {
      it("creates signature header default values") {
        let cert = getTestCertificate(TestCertificate.test)
        let configuration = try CodeSigningConfiguration(
          embeddedCertificateString: cert,
          metadata: [:],
          includeManifestResponseCertificateChain: false,
          allowUnsignedManifests: false
        )
        let signatureHeader = configuration.createAcceptSignatureHeader()
        expect(signatureHeader) == "sig, keyid=\"root\", alg=\"rsa-v1_5-sha256\""
      }

      it("creates signature header values from config") {
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
        expect(signatureHeader) == "sig, keyid=\"test\", alg=\"rsa-v1_5-sha256\""
      }

      it("creates signature header escaped values") {
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
        expect(signatureHeader) == #"sig, keyid="test\"hello\\", alg="rsa-v1_5-sha256""#
      }

      it("creates signature header throws invalid arg") {
        let cert = getTestCertificate(TestCertificate.test)
        expect {
          try CodeSigningConfiguration(
            embeddedCertificateString: cert,
            metadata: [
              CodeSigningMetadataFields.AlgorithmFieldKey: "fake",
              CodeSigningMetadataFields.KeyIdFieldKey: "test"
            ],
            includeManifestResponseCertificateChain: false,
            allowUnsignedManifests: false)
        }.to(throwError(CodeSigningError.AlgorithmParseError))
      }
    }

    describe("validateSignature") {
      it("works for valid case") {
        let cert = getTestCertificate(TestCertificate.test)
        let configuration = try CodeSigningConfiguration(
          embeddedCertificateString: cert,
          metadata: [:],
          includeManifestResponseCertificateChain: false,
          allowUnsignedManifests: false
        )
        let signatureValidationResult = try configuration.validateSignature(
          signature: CertificateFixtures.testNewManifestBodySignature,
          signedData: CertificateFixtures.testNewManifestBody.data(using: .utf8)!,
          manifestResponseCertificateChain: nil
        )
        expect(signatureValidationResult.validationResult) == ValidationResult.valid
        expect(signatureValidationResult.expoProjectInformation).to(beNil())
      }

      it("returns false when signature is invalid") {
        let cert = getTestCertificate(TestCertificate.test)
        let configuration = try CodeSigningConfiguration(
          embeddedCertificateString: cert,
          metadata: [:],
          includeManifestResponseCertificateChain: false,
          allowUnsignedManifests: false
        )
        let signatureValidationResult = try configuration.validateSignature(
          signature: "sig=\"aGVsbG8=\"",
          signedData: CertificateFixtures.testNewManifestBody.data(using: .utf8)!,
          manifestResponseCertificateChain: nil
        )
        expect(signatureValidationResult.validationResult) == ValidationResult.invalid
        expect(signatureValidationResult.expoProjectInformation).to(beNil())
      }

      it("throws when key does not match") {
        let cert = getTestCertificate(TestCertificate.test)
        let configuration = try CodeSigningConfiguration(
          embeddedCertificateString: cert,
          metadata: [CodeSigningMetadataFields.KeyIdFieldKey: "test"],
          includeManifestResponseCertificateChain: false,
          allowUnsignedManifests: false
        )
        expect {
          try configuration.validateSignature(
            signature: "sig=\"aGVsbG8=\", keyid=\"other\"",
            signedData: CertificateFixtures.testNewManifestBody.data(using: .utf8)!,
            manifestResponseCertificateChain: nil
          )
        }.to(throwError(CodeSigningError.KeyIdMismatchError))
      }

      it("does not use chain in manifest response if flag is false") {
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
          signature: CertificateFixtures.testNewManifestBodySignature,
          signedData: CertificateFixtures.testNewManifestBody.data(using: .utf8)!,
          manifestResponseCertificateChain: leafCert + intermediateCert
        )
        expect(signatureValidationResult.validationResult) == ValidationResult.valid
        expect(signatureValidationResult.expoProjectInformation).to(beNil())
      }

      it("does use chain in manifest response if flag is true") {
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
          signature: CertificateFixtures.testNewManifestBodyValidChainLeafSignature,
          signedData: CertificateFixtures.testNewManifestBody.data(using: .utf8)!,
          manifestResponseCertificateChain: leafCert + intermediateCert
        )
        expect(signatureValidationResult.validationResult) == ValidationResult.valid

        let expoProjectInformation = signatureValidationResult.expoProjectInformation
        expect(expoProjectInformation?.scopeKey) == "@test/app"
        expect(expoProjectInformation?.projectId) == "285dc9ca-a25d-4f60-93be-36dc312266d7"
      }

      it("AllowsUnsignedManifestIfAllowUnsignedFlagIsTrue") {
        let testCert = getTestCertificate(TestCertificate.test)
        let configuration = try CodeSigningConfiguration(
          embeddedCertificateString: testCert,
          metadata: [CodeSigningMetadataFields.KeyIdFieldKey: "test"],
          includeManifestResponseCertificateChain: true,
          allowUnsignedManifests: true
        )
        let signatureValidationResult = try configuration.validateSignature(
          signature: nil,
          signedData: CertificateFixtures.testNewManifestBody.data(using: .utf8)!,
          manifestResponseCertificateChain: nil
        )
        expect(signatureValidationResult.validationResult) == ValidationResult.skipped
        expect(signatureValidationResult.expoProjectInformation).to(beNil())
      }

      it("ChecksSignedManifestIfAllowUnsignedFlagIsTrueButSignatureIsProvided") {
        let testCert = getTestCertificate(TestCertificate.test)
        let configuration = try CodeSigningConfiguration(
          embeddedCertificateString: testCert,
          metadata: [CodeSigningMetadataFields.KeyIdFieldKey: "test"],
          includeManifestResponseCertificateChain: true,
          allowUnsignedManifests: true
        )
        let signatureValidationResult = try configuration.validateSignature(
          signature: "sig=\"aGVsbG8=\"",
          signedData: CertificateFixtures.testNewManifestBody.data(using: .utf8)!,
          manifestResponseCertificateChain: nil
        )
        expect(signatureValidationResult.validationResult) == ValidationResult.invalid
        expect(signatureValidationResult.expoProjectInformation).to(beNil())
      }
    }
  }
}
