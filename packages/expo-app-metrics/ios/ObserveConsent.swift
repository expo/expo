// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import os

/// Whether the user consented to Observe collecting data. While not granted, app metrics stores
/// nothing and Observe sends nothing.
public enum ObserveConsent {
  public enum State: Sendable {
    case granted
    case notGranted
    /// The saved value could not be read, for example before the first unlock after a restart.
    /// Nothing is stored, and the launch cleanup keeps the stored data, because it can belong to
    /// a user who granted consent.
    case unknown
  }

  /// The consent of this process.
  struct Gate: Sendable {
    private(set) var state: State

    init(state: State) {
      self.state = state
    }
  }

  /// Resolved on first access: the saved value, else the `Info.plist` value that the `expo-observe` config plugin writes.
  private static let gate = OSAllocatedUnfairLock<Gate?>(initialState: nil)

  private static let savedValueUrl = try? MetricsDatabase.defaultDirectoryUrl().appendingPathComponent("observe-consent")

  public static var isGranted: Bool {
    return state == .granted
  }

  public static var state: State {
    return gate.withLock { gate in
      if let gate {
        return gate.state
      }
      let state = resolveState()
      gate = Gate(state: state)
      return state
    }
  }

  private static func resolveState() -> State {
    guard let savedValueUrl else {
      return .unknown
    }
    return readSavedState(at: savedValueUrl) ?? (isGranted(settings: Bundle.main.object(forInfoDictionaryKey: "ExpoObserve")) ? .granted : .notGranted)
  }

  /// `nil` when no value was saved, `.unknown` when the saved value cannot be read.
  static func readSavedState(at url: URL) -> State? {
    do {
      return try String(contentsOf: url, encoding: .utf8) == "granted" ? .granted : .notGranted
    } catch CocoaError.fileReadNoSuchFile {
      return nil
    } catch {
      logger.warn("[AppMetrics] Failed to read the saved Observe consent: \(error.localizedDescription)")
      return .unknown
    }
  }

  /// Returns whether the value was written.
  static func save(granted: Bool, to url: URL) -> Bool {
    do {
      try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
      try Data((granted ? "granted" : "not-granted").utf8).write(to: url, options: .atomic)
      return true
    } catch {
      logger.warn("[AppMetrics] Failed to save the Observe consent: \(error.localizedDescription)")
      return false
    }
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
    guard isGranted() else {
      unsavedValues.withLock { $0[key] = value }
      return
    }
    defaults.set(value, forKey: key)
  }
}
