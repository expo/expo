// Copyright 2015-present 650 Industries. All rights reserved.

/**
 The literals of the fingerprint-check protocol.

 A tool cannot read a physical device's app container, so it asks the app instead: it opens a
 trigger URL carrying a nonce and a callback address, and the app posts its embedded fingerprint
 back. The dev-launcher responder and the expo-linking filter that keeps the trigger out of app
 navigation both match on these names, so they live here rather than being spelled twice.

 The other side is `fingerprintCheckProtocol.ts` in expo/expo-agent-cli. Neither repository can
 import the other, so a change here has to be made there too.
 */
public enum FingerprintCheckProtocol {
  /**
   Query parameter that marks a URL as a fingerprint-check trigger.

   The channel is selected by this parameter and never by a URL host. A host reads as a
   destination and would take a name out of the app's own route namespace; a reserved `__expo_*`
   parameter says what it is and composes with any link the app already handles.
   */
  public static let markerParam = "__expo_fingerprint_check"

  /// The only accepted value of `markerParam`.
  public static let markerValue = "1"

  /// Query parameter carrying the one-time nonce that ties a response to the run that asked.
  public static let nonceParam = "__expo_fingerprint_nonce"

  /// Query parameter carrying the callback URL the app posts its answer to.
  public static let callbackParam = "__expo_fingerprint_callback"

  /// The only accepted path of the callback URL.
  public static let callbackPath = "/fingerprint-callback"

  /// Response body key echoing the nonce back.
  public static let nonceBodyKey = "nonce"

  /// Response body key carrying the embedded hash, or null when the build embedded none.
  public static let fingerprintBodyKey = "fingerprint"

  /// Response body key carrying the `@expo/fingerprint` version that produced the hash.
  public static let fingerprintVersionBodyKey = "fingerprintVersion"
}
