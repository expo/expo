// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoAppMetrics

/**
 Snapshot of the last `configure(...)` payload.
 */
internal struct PersistedConfig: Codable {
  var dispatchingEnabled: Bool?
  var dispatchInDebug: Bool?
  var sampleRate: Double?
}

/**
 Bundle-derived facts pushed from the JS layer at package import time.

 Set atomically by `setBundleDefaults`.
 */
internal struct PersistedBundleDefaults: Codable {
  var environment: String
  var isJsDev: Bool
}

/**
 Class that manages a custom `UserDefaults` database with `"dev.expo.observe"` suite name.
 */
@AppMetricsActor
internal final class ObserveUserDefaults: UserDefaults {
  /**
   Singleton instance of the user defaults for EAS Observe.
   */
  private static let defaults = ObserveUserDefaults()

  /**
   Enum with keys used within this user defaults database.
   */
  private enum Keys: String {
    case lastDispatchedMetricId
    case lastDispatchedLogId
    case lastDispatchDate
    case config
    case bundleDefaults
  }

  private init() {
    // It's safe to force-unwrap as `init?(suiteName:)` fails only if `suiteName`
    // is the same as the app's main bundle identifier or the global domain.
    super.init(suiteName: "dev.expo.observe")!
  }

  /**
   Date when events with metrics were last sent and received by the backend.
   */
  static var lastDispatchDate: Date? {
    get {
      if let dateString = defaults.string(forKey: Keys.lastDispatchDate.rawValue) {
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: dateString)
      }
      return nil
    }
    set {
      defaults.set(newValue?.ISO8601Format(), forKey: Keys.lastDispatchDate.rawValue)
    }
  }

  /**
   Id of the last metric row dispatched. Each successful dispatch advances this past the largest id
   in the batch so the next dispatch reads only newer rows. Auto-increment ids are monotonic in
   SQLite, so a date-independent cursor avoids drift when the device clock changes.
   */
  static var lastDispatchedMetricId: Int64 {
    get {
      return (defaults.object(forKey: Keys.lastDispatchedMetricId.rawValue) as? Int64) ?? -1
    }
    set {
      defaults.set(newValue, forKey: Keys.lastDispatchedMetricId.rawValue)
    }
  }

  /**
   Id of the last log row dispatched. Tracked separately from the metric cursor so a logs request
   failure does not block metrics dispatch (and vice versa) — both signals move forward independently.
   */
  static var lastDispatchedLogId: Int64 {
    get {
      return (defaults.object(forKey: Keys.lastDispatchedLogId.rawValue) as? Int64) ?? -1
    }
    set {
      defaults.set(newValue, forKey: Keys.lastDispatchedLogId.rawValue)
    }
  }

  static var config: PersistedConfig? {
    guard let data = defaults.data(forKey: Keys.config.rawValue) else { return nil }
    return try? JSONDecoder().decode(PersistedConfig.self, from: data)
  }

  static func setConfig(_ newValue: PersistedConfig) {
    guard let data = try? JSONEncoder().encode(newValue) else { return }
    defaults.set(data, forKey: Keys.config.rawValue)
  }

  static var bundleDefaults: PersistedBundleDefaults? {
    guard let data = defaults.data(forKey: Keys.bundleDefaults.rawValue) else { return nil }
    return try? JSONDecoder().decode(PersistedBundleDefaults.self, from: data)
  }

  static func setBundleDefaults(_ newValue: PersistedBundleDefaults) {
    guard let data = try? JSONEncoder().encode(newValue) else { return }
    defaults.set(data, forKey: Keys.bundleDefaults.rawValue)
  }
}
