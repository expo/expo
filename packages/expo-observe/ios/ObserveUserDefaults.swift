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
    case lastDispatchedEntryId
    case lastDispatchDate
    case config
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
   Id of the last dispatched entry. It is used to prevent dispatching entries multiple times. The ids reflect the order of creation.
   Using the creation date is not the best idea as the device's date can be changed by the user or shift along with the timezone.
   */
  static var lastDispatchedEntryId: Int {
    get {
      return defaults.object(forKey: Keys.lastDispatchedEntryId.rawValue) as? Int ?? -1
    }
    set {
      defaults.set(newValue, forKey: Keys.lastDispatchedEntryId.rawValue)
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
}
