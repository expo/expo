// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import EXDevLauncher

@Suite("EXDevLauncherFingerprintCheck")
struct EXDevLauncherFingerprintCheckTests {
  /// The trigger is host-agnostic, so `host` defaults to a user-land route to prove the marker
  /// alone selects the channel. `marker` nil leaves the reserved parameter off entirely.
  ///
  /// The parameter names are spelled out here rather than taken from `FingerprintCheckProtocol`
  /// on purpose: these are the literals the agent CLI sends, so a rename of the constant has to
  /// fail here. Assert against the wire format, not against the implementation's own spelling.
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

  @Test("accepts a trigger whose host is an app route, because the marker selects the channel")
  func validRequestOnAnAppRouteHost() {
    let url = triggerUrl(host: "login", nonce: "abc", callback: "http://192.168.1.50:1/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url)?.nonce == "abc")
  }

  @Test("accepts a trigger with no host at all")
  func validRequestWithNoHost() {
    let url = triggerUrl(host: "", nonce: "abc", callback: "http://192.168.1.50:1/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url)?.nonce == "abc")
  }

  @Test("accepts a callback on a private IPv4 address, and keeps its port")
  func validRequestWithPrivateIPv4Callback() {
    let url = triggerUrl(nonce: "abc", callback: "http://192.168.1.50:54321/fingerprint-callback")

    let request = FingerprintCheckRequest.parse(url)

    #expect(request?.nonce == "abc")
    #expect(request?.callback.absoluteString == "http://192.168.1.50:54321/fingerprint-callback")
  }

  @Test("accepts a callback in 10.0.0.0/8")
  func validRequestWith10DotCallback() {
    let url = triggerUrl(nonce: "abc", callback: "http://10.1.2.3:54321/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) != nil)
  }

  @Test("accepts a callback in 172.16.0.0/12")
  func validRequestWith172Slash12Callback() {
    let url = triggerUrl(nonce: "abc", callback: "http://172.20.0.5:54321/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) != nil)
  }

  @Test("accepts a callback in the carrier-grade NAT range")
  func validRequestWithCGNCallback() {
    let url = triggerUrl(nonce: "abc", callback: "http://100.100.0.5:54321/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) != nil)
  }

  @Test("accepts a callback on an IPv6 unique local address")
  func validRequestWithIPv6ULACallback() {
    let url = triggerUrl(nonce: "abc", callback: "http://[fc00::1]:54321/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) != nil)
  }

  // MARK: - Rejected requests

  @Test("rejects a URL without the reserved marker parameter")
  func rejectsUrlWithoutTheMarkerParam() {
    let url = triggerUrl(marker: nil, nonce: "abc", callback: "http://192.168.1.50:1/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }

  @Test("rejects a marker parameter set to anything but 1")
  func rejectsMarkerParamWithAnotherValue() {
    let url = triggerUrl(marker: "0", nonce: "abc", callback: "http://192.168.1.50:1/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }

  @Test("rejects a URL with no query at all")
  func rejectsUrlWithNoQueryAtAll() {
    #expect(FingerprintCheckRequest.parse(URL(string: "exp+app://expo-fingerprint-check")!) == nil)
  }

  @Test("rejects a trigger with no nonce")
  func rejectsMissingNonce() {
    let url = triggerUrl(nonce: nil, callback: "http://192.168.1.50:1/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }

  @Test("rejects an empty nonce")
  func rejectsEmptyNonce() {
    let url = triggerUrl(nonce: "", callback: "http://192.168.1.50:1/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }

  @Test("rejects a trigger with no callback")
  func rejectsMissingCallback() {
    let url = triggerUrl(nonce: "abc", callback: nil)

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }

  @Test("rejects an https callback, which the CLI never emits")
  func rejectsHttpsCallbackScheme() {
    let url = triggerUrl(nonce: "abc", callback: "https://192.168.1.50:1/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }

  @Test("rejects a file:// callback")
  func rejectsFileCallbackScheme() {
    let url = triggerUrl(nonce: "abc", callback: "file:///etc/passwd")

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }

  @Test("rejects a DNS name callback, resolving no names")
  func rejectsDnsNameCallbackHost() {
    let url = triggerUrl(nonce: "abc", callback: "http://attacker.example/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }

  @Test("rejects a public IP callback, the SSRF guard")
  func rejectsPublicIPCallbackHost() {
    let url = triggerUrl(nonce: "abc", callback: "http://8.8.8.8:1/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }

  @Test("rejects a loopback callback")
  func rejectsLoopbackCallbackHost() {
    let url = triggerUrl(nonce: "abc", callback: "http://127.0.0.1:1/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }

  @Test("rejects a callback on any other path")
  func rejectsWrongCallbackPath() {
    let url = triggerUrl(nonce: "abc", callback: "http://192.168.1.50:1/x")

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }

  @Test("rejects an address just outside 172.16.0.0/12")
  func rejectsAddressJustOutsideThe172Slash12Range() {
    let url = triggerUrl(nonce: "abc", callback: "http://172.32.0.5:1/fingerprint-callback")

    #expect(FingerprintCheckRequest.parse(url) == nil)
  }
}
