// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import os

/// Whether the user consented to Observe collecting data. While not granted, app metrics stores
/// nothing and Observe sends nothing.
public enum ObserveConsent {
  public enum State: Sendable {
    case granted
    case notGranted
  }

  /// The consent of this process and the changes it allows.
  private struct Gate: Sendable {
    private(set) var state: State
    private var hasRevoked = false

    init(state: State) {
      self.state = state
    }

    /// Returns whether the gate changed. After a revoke, a grant changes it only at the next launch.
    mutating func apply(granted: Bool) -> Bool {
      if granted {
        guard state != .granted, !hasRevoked else {
          return false
        }
        state = .granted
      } else {
        guard state != .notGranted else {
          return false
        }
        state = .notGranted
        hasRevoked = true
      }
      return true
    }
  }

  // UserDefaults is thread-safe, and the lock protects the gate.
  final class Store: @unchecked Sendable {
    private let defaults: UserDefaults
    private let gate: OSAllocatedUnfairLock<Gate>
    private let saveBufferedSettings: @Sendable () -> Void

    init(defaults: UserDefaults, settings: Any?, saveBufferedSettings: @escaping @Sendable () -> Void) {
      self.defaults = defaults
      self.saveBufferedSettings = saveBufferedSettings
      self.gate = OSAllocatedUnfairLock(initialState: Gate(state: resolveState(from: defaults, settings: settings)))
    }

    var state: State {
      return gate.withLock { $0.state }
    }

    func update(granted: Bool) -> Bool {
      save(granted: granted, to: defaults)
      return ConsentGatedDefaults.transitionLock.withLock {
        gate.withLock { gate in
          guard gate.apply(granted: granted) else {
            return false
          }
          if granted {
            saveBufferedSettings()
          }
          return true
        }
      }
    }
  }

  private static let shared = Store(
    defaults: .standard,
    settings: Bundle.main.object(forInfoDictionaryKey: "ExpoObserve"),
    saveBufferedSettings: ConsentGatedDefaults.saveUnsavedValues
  )

  // A revoke deletes the settings suites, so the consent value lives in standard defaults.
  static let savedValueKey = "dev.expo.app-metrics.observe-consent"

  public static var isGranted: Bool {
    return state == .granted
  }

  public static var state: State {
    return shared.state
  }

  static func resolveState(from defaults: UserDefaults, settings: Any?) -> State {
    // TODO(ENG-29437): Verify the iOS UserDefaults read after reboot and before the first unlock.
    if let saved = defaults.string(forKey: savedValueKey) {
      return saved == "granted" ? .granted : .notGranted
    }
    return isGranted(settings: settings) ? .granted : .notGranted
  }

  /// Saves the choice for the next launch and returns whether collection changes in this process.
  static func update(granted: Bool) -> Bool {
    return shared.update(granted: granted)
  }

  static func save(granted: Bool, to defaults: UserDefaults) {
    defaults.set(granted ? "granted" : "not-granted", forKey: savedValueKey)
  }

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
  // Values set without consent. The app sends its config at startup, before the user can grant
  // consent. The first grant saves these values, so Observe does not send with the defaults.
  private let unsavedValues = Mutex<[String: Any]>([:])

  public convenience init(_ defaults: UserDefaults) {
    self.init(defaults, isGranted: { ObserveConsent.isGranted })
  }

  init(_ defaults: UserDefaults, isGranted: @escaping @Sendable () -> Bool) {
    self.defaults = defaults
    self.isGranted = isGranted
    Self.stores.withLock { $0.append(self) }
  }

  // A store that was never created holds no values in memory, so this list has every such value.
  private static let stores = Mutex<[ConsentGatedDefaults]>([])

  // Taken before the consent gate lock. `ObserveConsent.update` changes the gate under it, and the
  // writes and the not-granted reads check the gate under it.
  static let transitionLock = OSAllocatedUnfairLock()

  /// Saves the values kept in memory, then forgets them. Runs at the first grant.
  static func saveUnsavedValues() {
    for store in stores.withLock({ $0 }) {
      let values = store.unsavedValues.withLock { values in
        defer { values = [:] }
        return values
      }
      for (key, value) in values {
        store.defaults.set(value, forKey: key)
      }
    }
  }

  public func object(forKey key: String) -> Any? {
    var value: Any?
    if whileNotGranted({ value = unsavedValues.withLock { $0[key] } }) {
      return value
    }
    return defaults.object(forKey: key)
  }

  // `ObserveConsent.update` changes the gate under the same lock. So a write cannot land in memory
  // after the first grant saved those values, or in the suite after a revoke closed the gate.
  public func set(_ value: Any?, forKey key: String) {
    Self.transitionLock.withLockUnchecked {
      if isGranted() {
        defaults.set(value, forKey: key)
      } else {
        unsavedValues.withLock { $0[key] = value }
      }
    }
  }

  // Runs `body` and returns true while consent is not granted. Like `set`, but a read with consent
  // does not wait for the lock: a stale value read during a transition changes nothing on disk.
  private func whileNotGranted(_ body: () -> Void) -> Bool {
    guard !isGranted() else {
      return false
    }
    return Self.transitionLock.withLockUnchecked {
      guard !isGranted() else {
        return false
      }
      body()
      return true
    }
  }
}
