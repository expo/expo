//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

class SignatureHeaderInfoSpec : ExpoSpec {
  override class func spec() {
    describe("parseSignatureHeader") {
      it("ParsesCodeSigningInfo") {
        let codeSigningInfo = try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\", keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
        expect(codeSigningInfo.signature) == "12345"
        expect(codeSigningInfo.keyId) == "test"
        expect(codeSigningInfo.algorithm) == CodeSigningAlgorithm.RSA_SHA256
      }

      it("DefaultsKeyIdAndAlg") {
        let codeSigningInfo = try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\"")
        expect(codeSigningInfo.signature) == "12345"
        expect(codeSigningInfo.keyId) == "root"
        expect(codeSigningInfo.algorithm) == CodeSigningAlgorithm.RSA_SHA256
      }

      it("ThrowsForInvalidAlg") {
        expect {
          try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "fake=\"12345\"")
        }.to(throwError(CodeSigningError.SignatureHeaderSigMissing))

        expect {
          try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "fs=1")
        }.to(throwError(CodeSigningError.SignatureHeaderStructuredFieldParseError))

        expect {
          try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\", alg=\"blah\"")
        }.to(throwError(CodeSigningError.AlgorithmParseError))
      }
    }
  }
}
