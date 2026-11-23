// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// Whether the user consented to Observe collecting data. While not granted, app metrics stores
/// nothing and Observe sends nothing.
public enum ObserveConsent {
  /// Read on first access from the `Info.plist` value that the `expo-observe` config plugin writes.
  public static let isGranted: Bool = isGranted(settings: Bundle.main.object(forInfoDictionaryKey: "ExpoObserve"))

  /// Consent from the `consent` key of the `ExpoObserve` dictionary in `Info.plist`. Granted when the
  /// dictionary or the key is absent.
  static func isGranted(settings: Any?) -> Bool {
    guard let settings else {
      return true
    }
    // A value that is not a dictionary must not take the absent path, because that grants consent.
    guard let settings = settings as? [String: Any] else {
      logger.warn(
        "[AppMetrics] The `ExpoObserve` value in `Info.plist` is \(settings), which is not a dictionary, so Observe stays inactive. Make `ExpoObserve` a dictionary with a `consent` key, or run prebuild again to let the `expo-observe` config plugin write it."
      )
      return false
    }
    guard let consent = settings["consent"] else {
      return true
    }
    let value = consent as? String
    if value != "granted" && value != "not-granted" {
      logger.warn(
        "[AppMetrics] The `ExpoObserve.consent` value in `Info.plist` is \(consent), which is not 'granted' or 'not-granted', so Observe stays inactive. Set the `consent` option of the `expo-observe` config plugin to 'granted' or 'not-granted', then run prebuild again."
      )
    }
    return value == "granted"
  }
}

/// A settings suite that saves nothing while consent is not granted.
public final class ConsentGatedDefaults: @unchecked Sendable {
  // `UserDefaults` is thread-safe, and the in-memory values are behind a mutex.
  private let defaults: UserDefaults
  private let isGranted: @Sendable () -> Bool
  // Values set without consent. They are kept only in memory, and reads return them.
  private let unsavedValues = Mutex<[String: Any]>([:])

  public convenience init(_ defaults: UserDefaults) {
    self.init(defaults, isGranted: { ObserveConsent.isGranted })
  }

  init(_ defaults: UserDefaults, isGranted: @escaping @Sendable () -> Bool) {
    self.defaults = defaults
    self.isGranted = isGranted
  }

  public func object(forKey key: String) -> Any? {
    guard isGranted() else {
      return unsavedValues.withLock { $0[key] }
    }
    return defaults.object(forKey: key)
  }

  public func set(_ value: Any?, forKey key: String) {
    if isGranted() {
      defaults.set(value, forKey: key)
    } else {
      unsavedValues.withLock { $0[key] = value }
    }
  }
}
