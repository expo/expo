// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// Whether the user consented to Observe collecting data. While not granted, app metrics stores
/// nothing and Observe sends nothing.
public enum ObserveConsent {
  // TODO(ENG-29293): Read the config with a public reader from expo-modules-core when it exists.
  /// Read from the app config embedded in the app on first access.
  public static let isGranted: Bool = isGranted(appConfig: EmbeddedAppConfig.read())

  /// Consent from the `extra.eas.observe.consent` key of the app config, granted when the key is missing.
  static func isGranted(appConfig: [String: Any]?) -> Bool {
    let extra = appConfig?["extra"] as? [String: Any]
    let eas = extra?["eas"] as? [String: Any]
    let observe = eas?["observe"] as? [String: Any]
    guard let consent = observe?["consent"] else {
      return true
    }
    let value = consent as? String
    if value != "granted" && value != "not-granted" {
      logger.warn(
        "[AppMetrics] The app config value `extra.eas.observe.consent` is \(consent), which is not 'granted' or 'not-granted', so Observe stays inactive. Set it to 'granted' or 'not-granted'."
      )
    }
    return value == "granted"
  }
}
