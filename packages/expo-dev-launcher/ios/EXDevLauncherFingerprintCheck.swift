// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

/** A validated trigger URL. Separate from the POST so the SSRF guard is unit-testable. */
internal struct FingerprintCheckRequest: Equatable {
  let nonce: String
  let callback: URL

  internal static func parse(_ url: URL) -> FingerprintCheckRequest? {
    // Matched on a reserved query parameter, not a host: hosts belong to the app's own routes.
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
          let queryItems = components.queryItems,
          queryItems.contains(where: {
            $0.name == FingerprintCheckProtocol.markerParam
              && $0.value == FingerprintCheckProtocol.markerValue
          }),
          let nonce = queryItems.first(where: { $0.name == FingerprintCheckProtocol.nonceParam })?.value,
          !nonce.isEmpty,
          let callbackString = queryItems.first(where: {
            $0.name == FingerprintCheckProtocol.callbackParam
          })?.value,
          let callback = URL(string: callbackString),
          // The CLI never emits https, and https to an IP literal would fail TLS anyway.
          callback.scheme == "http",
          callback.path == FingerprintCheckProtocol.callbackPath,
          let callbackHost = callback.host,
          isPrivateAddress(callbackHost) else {
      return nil
    }
    return FingerprintCheckRequest(nonce: nonce, callback: callback)
  }
}

/**
 * True when `host` is an IP literal in a private or link-local range, resolving no DNS names.
 * This is the SSRF guard: without it a web page could deep-link a debug build with a callback
 * pointing anywhere.
 */
internal func isPrivateAddress(_ host: String) -> Bool {
  var ipv4Addr = in_addr()
  if host.withCString({ inet_pton(AF_INET, $0, &ipv4Addr) }) == 1 {
    let address = UInt32(bigEndian: ipv4Addr.s_addr)
    return isPrivateIPv4(UInt8(address >> 24), UInt8(address >> 16 & 0xFF))
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
 * Answers a fingerprint-check trigger URL: a tool cannot read a physical device's app container,
 * so the app posts its embedded fingerprint back instead.
 *
 * The literals are shared with `fingerprintCheckProtocol.ts` in expo/expo-agent-cli.
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
      FingerprintCheckProtocol.nonceBodyKey: nonce,
      FingerprintCheckProtocol.fingerprintBodyKey: fingerprint?.hash ?? NSNull(),
      FingerprintCheckProtocol.fingerprintVersionBodyKey: fingerprint?.fingerprintVersion ?? NSNull()
    ]

    var urlRequest = URLRequest(url: request.callback)
    urlRequest.httpMethod = "POST"
    urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
    urlRequest.httpBody = try? JSONSerialization.data(withJSONObject: body)
    urlRequest.timeoutInterval = 10

    // The session retains the redirect-blocking delegate until the task ends.
    let delegate = NoRedirectSessionDelegate()
    let session = URLSession(configuration: .ephemeral, delegate: delegate, delegateQueue: nil)
    session.dataTask(with: urlRequest).resume()
    session.finishTasksAndInvalidate()
    return true
    #else
    // Debug only: a release app posting to a URL from a deep link would be an SSRF primitive.
    return false
    #endif
  }
}
