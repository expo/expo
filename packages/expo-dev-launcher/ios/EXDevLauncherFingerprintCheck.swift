// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

/**
 * A parsed and validated fingerprint-check trigger URL. Parsing is kept separate from the POST
 * so the validation (in particular the SSRF guard on the callback) is unit-testable without a
 * network stack.
 */
internal struct FingerprintCheckRequest: Equatable {
  let nonce: String
  let callback: URL

  /** Returns nil unless `url` is a valid fingerprint-check trigger with a safe callback. */
  internal static func parse(_ url: URL) -> FingerprintCheckRequest? {
    guard url.host == "expo-fingerprint-check",
          let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
          let queryItems = components.queryItems,
          let nonce = queryItems.first(where: { $0.name == "nonce" })?.value,
          !nonce.isEmpty,
          let callbackString = queryItems.first(where: { $0.name == "callback" })?.value,
          let callback = URL(string: callbackString),
          // The CLI never emits https, and https to an IP literal would fail TLS anyway.
          callback.scheme == "http",
          // Matches `CALLBACK_PATH` in the CLI's fingerprintCheckProtocol.ts.
          callback.path == "/fingerprint-callback",
          let callbackHost = callback.host,
          isPrivateAddress(callbackHost) else {
      return nil
    }
    return FingerprintCheckRequest(nonce: nonce, callback: callback)
  }
}

/**
 * Returns true when `host` is an IP literal (no DNS names resolved) inside a private or
 * link-local range. This is the SSRF guard on the callback: without it, any web page could
 * deep-link a debug build with a callback pointing at an arbitrary DNS name or public address.
 */
internal func isPrivateAddress(_ host: String) -> Bool {
  var ipv4Addr = in_addr()
  if host.withCString({ inet_pton(AF_INET, $0, &ipv4Addr) }) == 1 {
    let octets = withUnsafeBytes(of: ipv4Addr.s_addr) { Array($0) }
    return isPrivateIPv4(octets[0], octets[1])
  }

  var ipv6Addr = in6_addr()
  if host.withCString({ inet_pton(AF_INET6, $0, &ipv6Addr) }) == 1 {
    let bytes = withUnsafeBytes(of: ipv6Addr) { Array($0) }
    return isPrivateIPv6(bytes[0], bytes[1])
  }

  return false
}

/** 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 (link-local), 100.64.0.0/10 (CGN). */
private func isPrivateIPv4(_ a: UInt8, _ b: UInt8) -> Bool {
  switch (a, b) {
  case (10, _): return true
  case (172, 16...31): return true
  case (192, 168): return true
  case (169, 254): return true
  case (100, 64...127): return true
  default: return false
  }
}

/** fc00::/7 (unique local) and fe80::/10 (link-local). */
private func isPrivateIPv6(_ b0: UInt8, _ b1: UInt8) -> Bool {
  if (b0 & 0xFE) == 0xFC {
    return true
  }
  if b0 == 0xFE && (b1 & 0xC0) == 0x80 {
    return true
  }
  return false
}

/** Blocks HTTP redirects so a compromised callback endpoint can't retarget the POST. */
private class NoRedirectSessionDelegate: NSObject, URLSessionTaskDelegate {
  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    completionHandler(nil)
  }
}

/**
 * Responds to the needs-rebuild fingerprint-check trigger URL on a physical iOS device. The CLI
 * cannot reach the device's Metro directly, so it deep-links this responder with a callback URL
 * and posts the embedded fingerprint back. `@expo/cli`'s `fingerprintCheckProtocol.ts` is the
 * source of truth for the literals below.
 */
@objc(EXDevLauncherFingerprintCheck)
public class EXDevLauncherFingerprintCheck: NSObject {
  /** Handles a fingerprint-check trigger URL. Returns true when the URL was consumed. */
  @objc public static func handle(_ url: URL) -> Bool {
    #if DEBUG
    guard let request = FingerprintCheckRequest.parse(url) else {
      return false
    }

    let nonce = request.nonce
    let fingerprint = EmbeddedFingerprint.read()
    let body: [String: Any] = [
      "nonce": nonce,
      "fingerprint": fingerprint ?? NSNull()
    ]

    var urlRequest = URLRequest(url: request.callback)
    urlRequest.httpMethod = "POST"
    urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
    urlRequest.httpBody = try? JSONSerialization.data(withJSONObject: body)
    urlRequest.timeoutInterval = 10

    // The delegate blocks redirects; the ephemeral session keeps it retained until the task
    // completes or times out, then `finishTasksAndInvalidate()` lets the session deallocate.
    let delegate = NoRedirectSessionDelegate()
    let session = URLSession(configuration: .ephemeral, delegate: delegate, delegateQueue: nil)
    // Fire and forget: no retries, no response handling.
    session.dataTask(with: urlRequest).resume()
    session.finishTasksAndInvalidate()
    return true
    #else
    // A release app POSTing to a URL named in a deep link would be an SSRF/port-probe
    // primitive, so the responder is debug-only. Let the URL flow through normal handling.
    return false
    #endif
  }
}
