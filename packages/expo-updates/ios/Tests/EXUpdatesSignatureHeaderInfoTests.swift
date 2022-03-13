//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class EXUpdatesSignatureHeaderInfoTests : XCTestCase {
  func test_parseSignatureHeader_ParsesCodeSigningInfo() throws {
    let codeSigningInfo = try EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\", keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
    XCTAssertEqual(codeSigningInfo.signature, "12345")
    XCTAssertEqual(codeSigningInfo.keyId, "test")
    XCTAssertEqual(codeSigningInfo.algorithm, EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
  }

    func test_parseSignatureHeader_DefaultsKeyIdAndAlg() throws {
      let codeSigningInfo = try EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\"")
      XCTAssertEqual(codeSigningInfo.signature, "12345")
      XCTAssertEqual(codeSigningInfo.keyId, "root")
      XCTAssertEqual(codeSigningInfo.algorithm, EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    }

    func test_parseSignatureHeader_ThrowsForInvalidAlg() {
      XCTAssertThrowsError(try EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: nil)) { error in
        XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.SignatureHeaderMissing)
      }
      
      XCTAssertThrowsError(try EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "fake=\"12345\"")) { error in
        XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.SignatureHeaderSigMissing)
      }
      
      XCTAssertThrowsError(try EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "s=1")) { error in
        XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.SignatureHeaderStructuredFieldParseError)
      }
      
      XCTAssertThrowsError(try EXUpdatesSignatureHeaderInfo.parseSignatureHeader(signatureHeader: "sig=\"12345\", alg=\"blah\"")) { error in
        XCTAssertEqual(error as? EXUpdatesCodeSigningError, EXUpdatesCodeSigningError.AlgorithmParseError)
      }
    }
}
