//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class EXUpdatesSignatureHeaderInfoTests : XCTestCase {
  func testParsesCodeSigningInfo() throws {
    let codeSigningInfo = try EXUpdatesSignatureHeaderInfo(signatureHeader: "sig=\"12345\", keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
    XCTAssertEqual(codeSigningInfo.signature, "12345")
    XCTAssertEqual(codeSigningInfo.keyId, "test")
    XCTAssertEqual(codeSigningInfo.algorithm, EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
  }

    func testDefaultsKeyIdAndAlg() throws {
      let codeSigningInfo = try EXUpdatesSignatureHeaderInfo(signatureHeader: "sig=\"12345\"")
      XCTAssertEqual(codeSigningInfo.signature, "12345")
      XCTAssertEqual(codeSigningInfo.keyId, "root")
      XCTAssertEqual(codeSigningInfo.algorithm, EXUpdatesCodeSigningAlgorithm.RSA_SHA256)
    }

    func testThrowsForInvalidAlg() {
      XCTAssertThrowsError(try EXUpdatesSignatureHeaderInfo(signatureHeader: nil)) { error in
        XCTAssertEqual(error as? EXUpdatesSignatureHeaderInfoError, EXUpdatesSignatureHeaderInfoError.MissingSignatureHeader)
      }
      
      XCTAssertThrowsError(try EXUpdatesSignatureHeaderInfo(signatureHeader: "fake=\"12345\"")) { error in
        XCTAssertEqual(error as? EXUpdatesSignatureHeaderInfoError, EXUpdatesSignatureHeaderInfoError.SigMissing)
      }
      
      XCTAssertThrowsError(try EXUpdatesSignatureHeaderInfo(signatureHeader: "s=1")) { error in
        XCTAssertEqual(error as? EXUpdatesSignatureHeaderInfoError, EXUpdatesSignatureHeaderInfoError.StructuredFieldParseError)
      }
      
      XCTAssertThrowsError(try EXUpdatesSignatureHeaderInfo(signatureHeader: "sig=\"12345\", alg=\"blah\"")) { error in
        XCTAssertEqual(error as? EXUpdatesCodeSigningAlgorithmError, EXUpdatesCodeSigningAlgorithmError.parseError)
      }
    }
}
