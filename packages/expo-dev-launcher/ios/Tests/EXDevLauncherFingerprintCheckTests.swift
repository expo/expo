// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class EXDevLauncherFingerprintCheckTests: XCTestCase {
  /// The trigger is host-agnostic, so `host` defaults to a user-land route to prove the marker
  /// alone selects the channel. `marker` nil leaves the reserved parameter off entirely.
  private func triggerUrl(
    host: String = "some-app-route",
    marker: String? = "1",
    nonce: String?,
    callback: String?
  ) -> URL {
    var parts: [String] = []
    if let marker {
      parts.append("__expo_fingerprint_check=\(marker)")
    }
    if let nonce {
      parts.append("__expo_fingerprint_nonce=\(nonce)")
    }
    if let callback {
      let encoded = callback.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? callback
      parts.append("__expo_fingerprint_callback=\(encoded)")
    }
    return URL(string: "exp+app://\(host)?\(parts.joined(separator: "&"))")!
  }

  // MARK: - Valid requests

  func testValidRequestOnAnAppRouteHost() {
    let url = triggerUrl(host: "login", nonce: "abc", callback: "http://192.168.1.50:1/fingerprint-callback")

    XCTAssertEqual(FingerprintCheckRequest.parse(url)?.nonce, "abc")
  }

  func testValidRequestWithNoHost() {
    let url = triggerUrl(host: "", nonce: "abc", callback: "http://192.168.1.50:1/fingerprint-callback")

    XCTAssertEqual(FingerprintCheckRequest.parse(url)?.nonce, "abc")
  }

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

  func testRejectsUrlWithoutTheMarkerParam() {
    let url = triggerUrl(marker: nil, nonce: "abc", callback: "http://192.168.1.50:1/fingerprint-callback")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsMarkerParamWithAnotherValue() {
    let url = triggerUrl(marker: "0", nonce: "abc", callback: "http://192.168.1.50:1/fingerprint-callback")

    XCTAssertNil(FingerprintCheckRequest.parse(url))
  }

  func testRejectsUrlWithNoQueryAtAll() {
    XCTAssertNil(FingerprintCheckRequest.parse(URL(string: "exp+app://expo-fingerprint-check")!))
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
