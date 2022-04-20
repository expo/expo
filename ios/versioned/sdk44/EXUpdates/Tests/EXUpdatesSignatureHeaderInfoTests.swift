//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import ABI44_0_0EXUpdates

class ABI44_0_0EXUpdatesSignatureHeaderInfoTests : XCTestCase {
  func test_parseSignatureHeader_ParsesCodeSigningInfo() throws {
    let codeSigningInfo = try ABI44_0_0EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\", keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
    XCTAssertEqual(codeSigningInfo.signature, "12345")
    XCTAssertEqual(codeSigningInfo.keyId, "test")
    XCTAssertEqual(codeSigningInfo.algorithm, ABI44_0_0EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
  }

    func test_parseSignatureHeader_DefaultsKeyIdAndAlg() throws {
      let codeSigningInfo = try ABI44_0_0EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\"")
      XCTAssertEqual(codeSigningInfo.signature, "12345")
      XCTAssertEqual(codeSigningInfo.keyId, "root")
      XCTAssertEqual(codeSigningInfo.algorithm, ABI44_0_0EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    }

    func test_parseSignatureHeader_ThrowsForInvalidAlg() {      
      XCTAssertThrowsError(try ABI44_0_0EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "fake=\"12345\"")) { error in
        XCTAssertEqual(error as? ABI44_0_0EXUpdatesCodeSigningError, ABI44_0_0EXUpdatesCodeSigningError.SignatureHeaderSigMissing)
      }
      
      XCTAssertThrowsError(try ABI44_0_0EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "s=1")) { error in
        XCTAssertEqual(error as? ABI44_0_0EXUpdatesCodeSigningError, ABI44_0_0EXUpdatesCodeSigningError.SignatureHeaderStructuredFieldParseError)
      }
      
      XCTAssertThrowsError(try ABI44_0_0EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\", alg=\"blah\"")) { error in
        XCTAssertEqual(error as? ABI44_0_0EXUpdatesCodeSigningError, ABI44_0_0EXUpdatesCodeSigningError.AlgorithmParseError)
      }
    }
}
