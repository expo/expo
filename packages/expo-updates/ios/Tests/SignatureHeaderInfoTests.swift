//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class SignatureHeaderInfoTests : XCTestCase {
  func test_parseSignatureHeader_ParsesCodeSigningInfo() throws {
    let codeSigningInfo = try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\", keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
    XCTAssertEqual(codeSigningInfo.signature, "12345")
    XCTAssertEqual(codeSigningInfo.keyId, "test")
    XCTAssertEqual(codeSigningInfo.algorithm, CodeSigningAlgorithm.RSA_SHA256)
  }

    func test_parseSignatureHeader_DefaultsKeyIdAndAlg() throws {
      let codeSigningInfo = try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\"")
      XCTAssertEqual(codeSigningInfo.signature, "12345")
      XCTAssertEqual(codeSigningInfo.keyId, "root")
      XCTAssertEqual(codeSigningInfo.algorithm, CodeSigningAlgorithm.RSA_SHA256)
    }

    func test_parseSignatureHeader_ThrowsForInvalidAlg() {      
      XCTAssertThrowsError(try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "fake=\"12345\"")) { error in
        XCTAssertEqual(error as? CodeSigningError, CodeSigningError.SignatureHeaderSigMissing)
      }
      
      XCTAssertThrowsError(try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "s=1")) { error in
        XCTAssertEqual(error as? CodeSigningError, CodeSigningError.SignatureHeaderStructuredFieldParseError)
      }
      
      XCTAssertThrowsError(try SignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\", alg=\"blah\"")) { error in
        XCTAssertEqual(error as? CodeSigningError, CodeSigningError.AlgorithmParseError)
      }
    }
}
