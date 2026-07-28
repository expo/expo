// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
import dnssd

@testable import EXDevLauncher

class LocalNetworkVerdictTests: XCTestCase {
  func testPolicyDeniedMapsToDenied() {
    XCTAssertEqual(LocalNetworkClassifier.verdict(forDNSError: Int(kDNSServiceErr_PolicyDenied)), .denied)
  }

  func testNoAuthMapsToMisconfigured() {
    XCTAssertEqual(LocalNetworkClassifier.verdict(forDNSError: Int(kDNSServiceErr_NoAuth)), .misconfigured)
  }

  func testUnknownCodeMapsToUndetermined() {
    XCTAssertEqual(LocalNetworkClassifier.verdict(forDNSError: Int(kDNSServiceErr_Timeout)), .undetermined)
  }

  func testZeroMapsToUndetermined() {
    XCTAssertEqual(LocalNetworkClassifier.verdict(forDNSError: 0), .undetermined)
  }
}
