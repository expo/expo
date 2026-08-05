//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("SignatureHeaderInfo")
struct SignatureHeaderInfoTests {
  @Test
  func `ParsesCodeSigningInfo`() throws {
    let codeSigningInfo = try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\", keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
    #expect(codeSigningInfo.signature == "12345")
    #expect(codeSigningInfo.keyId == "test")
    #expect(codeSigningInfo.algorithm == CodeSigningAlgorithm.RSA_SHA256)
  }

  @Test
  func `DefaultsKeyIdAndAlg`() throws {
    let codeSigningInfo = try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\"")
    #expect(codeSigningInfo.signature == "12345")
    #expect(codeSigningInfo.keyId == "root")
    #expect(codeSigningInfo.algorithm == CodeSigningAlgorithm.RSA_SHA256)
  }

  @Test
  func `ThrowsForInvalidAlg`() {
    #expect {
      try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "fake=\"12345\"")
    } throws: { error in
      guard case CodeSigningError.SignatureHeaderSigMissing = error else {
        return false
      }
      return true
    }

    #expect {
      try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "fs=1")
    } throws: { error in
      guard case CodeSigningError.SignatureHeaderStructuredFieldParseError = error else {
        return false
      }
      return true
    }

    #expect {
      try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\", alg=\"blah\"")
    } throws: { error in
      guard case CodeSigningError.AlgorithmParseError = error else {
        return false
      }
      return true
    }
  }
}
