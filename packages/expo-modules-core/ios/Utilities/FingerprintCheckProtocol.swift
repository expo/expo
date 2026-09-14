// Copyright 2015-present 650 Industries. All rights reserved.

/**
 The literals of the fingerprint-check protocol, shared by the dev-launcher responder and the
 expo-linking filter that keeps the trigger out of app navigation.

 The other side is `fingerprintCheckProtocol.ts` in expo/expo-agent-cli. Neither repository can
 import the other, so a change here has to be made there too.
 */
public enum FingerprintCheckProtocol {
  /// Selects the channel. A host would take a name out of the app's own route namespace.
  public static let markerParam = "__expo_fingerprint_check"

  public static let markerValue = "1"

  public static let nonceParam = "__expo_fingerprint_nonce"

  public static let callbackParam = "__expo_fingerprint_callback"

  public static let callbackPath = "/fingerprint-callback"

  public static let nonceBodyKey = "nonce"

  /// Null when the build embedded no fingerprint.
  public static let fingerprintBodyKey = "fingerprint"

  /// The `@expo/fingerprint` version that produced the hash. Null when the build embedded none.
  public static let fingerprintVersionBodyKey = "fingerprintVersion"
}
