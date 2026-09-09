// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class EXDevLauncherFingerprintCheckTests: XCTestCase {
  private func triggerUrl(host: String = "expo-fingerprint-check", nonce: String?, callback: String?) -> URL {
    var query = ""
    if let nonce {
      query += "nonce=\(nonce)"
    }
    if let callback {
      if !query.isEmpty {
        query += "&"
      }
      let encoded = callback.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? callback
      query += "callback=\(encoded)"
    }
    return URL(string: "exp+app://\(host)?\(query)")!
  }

  // MARK: - Valid requests

  func testValidRequestWithPrivateIPv4Callback() {
    let url = triggerUrl(nonce: "abc", callback: "http://192.168.1.50:54321/fingerprint-callback")

    let request = FingerprintCheckRequest.parse(url)

    XCTAssertEqual(request?.nonce, "abc")
    XCTAssertEqual(request?.callback.absoluteString, "http://192.168.1.50:54321/fingerprint-callback")
  }

  func testValidRequestWith10DotCallback() {
    let url = triggerUrl(nonce: "abc", callback: "http://10.1.2.3:54321/fingerprint-callback")

    XCTAssertNotNil(FingerprintCheckRequest.parse(url))
  }

  func testValidRequestWith172Slash12Callback() {
    let url = triggerUrl(nonce: "abc", callback: "http://172.20.0.5:54321/fingerprint-callback")

    XCTAssertNotNil(FingerprintCheckRequest.parse(url))
  }

  func testValidRequestWithCGNCallback() {
    let url = triggerUrl(nonce: "abc", callback: "http://100.100.0.5:54321/fingerprint-callback")

    XCTAssertNotNil(FingerprintCheckRequest.parse(url))
  }

  func testValidRequestWithIPv6ULACallback() {
    let url = triggerUrl(nonce: "abc", callback: "http://[fc00::1]:54321/fingerprint-callback")

    XCTAssertNotNil(FingerprintCheckRequest.parse(url))
  }

  // MARK: - Rejected requests

  func testRejectsWrongHost() {
    let url = triggerUrl(host: "not-fingerprint-check", nonce: "abc", callback: "http://192.168.1.50:1/fingerprint-callback")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsMissingNonce() {
    let url = triggerUrl(nonce: nil, callback: "http://192.168.1.50:1/fingerprint-callback")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsEmptyNonce() {
    let url = triggerUrl(nonce: "", callback: "http://192.168.1.50:1/fingerprint-callback")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsMissingCallback() {
    let url = triggerUrl(nonce: "abc", callback: nil)

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsHttpsCallbackScheme() {
    let url = triggerUrl(nonce: "abc", callback: "https://192.168.1.50:1/fingerprint-callback")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsFileCallbackScheme() {
    let url = triggerUrl(nonce: "abc", callback: "file:///etc/passwd")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsDnsNameCallbackHost() {
    let url = triggerUrl(nonce: "abc", callback: "http://attacker.example/fingerprint-callback")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsPublicIPCallbackHost() {
    let url = triggerUrl(nonce: "abc", callback: "http://8.8.8.8:1/fingerprint-callback")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsLoopbackCallbackHost() {
    let url = triggerUrl(nonce: "abc", callback: "http://127.0.0.1:1/fingerprint-callback")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsWrongCallbackPath() {
    let url = triggerUrl(nonce: "abc", callback: "http://192.168.1.50:1/x")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsAddressJustOutsideThe172Slash12Range() {
    let url = triggerUrl(nonce: "abc", callback: "http://172.32.0.5:1/fingerprint-callback")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }
}
