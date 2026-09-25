// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/**
 The fingerprint check: how a tool asks a debug build for the fingerprint it embedded, and how the
 build answers.

 On `EmbeddedFingerprint` because the check has no subject without it. Both halves live in
 expo-modules-core because the dev-launcher responder and the expo-linking filter each need them
 and neither package can depend on the other.

 The other side is `fingerprintCheckProtocol.ts` in expo/expo-agent-cli. Neither repository can
 import the other, so a change here has to be made there too.
 */
public extension EmbeddedFingerprint {
  /// The reserved query parameters of the trigger URL.
  enum CheckProtocol {
    /// Selects the channel. A host would take a name out of the app's own route namespace.
    public static let markerParam = "__expo_fingerprint_check"

    public static let markerValue = "1"

    public static let nonceParam = "__expo_fingerprint_nonce"

    public static let callbackParam = "__expo_fingerprint_callback"

    public static let callbackPath = "/fingerprint-callback"

    public static func isCheckURL(_ url: URL) -> Bool {
      guard let queryItems = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems else {
        return false
      }
      return queryItems.contains { $0.name == markerParam && $0.value == markerValue }
    }
  }

  /// The JSON posted back to the callback. A build that embedded no fingerprint answers with nulls
  /// rather than silence, so the caller can tell that apart from a build that never replied.
  static func checkResponseBody(nonce: String, fingerprint: EmbeddedFingerprint?) -> [String: Any] {
    let body: [String: Any] = [
      "nonce": nonce,
      "fingerprint": fingerprint?.hash ?? NSNull(),
      "fingerprintVersion": fingerprint?.fingerprintVersion ?? NSNull()
    ]
    return body
  }
}
