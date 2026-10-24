/// Class that manages a custom `UserDefaults` database with `"dev.expo.app-metrics"` suite name.
public final class AppMetricsUserDefaults: UserDefaults {
  /// Singleton instance of the user defaults for AppMetrics.
  /// It is not isolated, but UserDefaults is thread-safe.
  nonisolated(unsafe) private static let defaults = AppMetricsUserDefaults()

  /// Enum with keys used within this user defaults database.
  private enum Keys: String {
    case lastAppLaunchState
    case environment
    case networkTracesConfiguration
    case hasMarkedInteractive
  }

  private init() {
    // It's safe to force-unwrap as `init?(suiteName:)` fails only if `suiteName`
    // is the same as the app's main bundle identifier or the global domain.
    super.init(suiteName: "dev.expo.app-metrics")!
  }

  public static var environment: String? {
    get {
      return defaults.string(forKey: Keys.environment.rawValue)
    }
    set {
      defaults.set(newValue, forKey: Keys.environment.rawValue)
    }
  }

  public nonisolated static func getDefaultEnvironment() -> String? {
    #if DEBUG
    return "development"
    #else
    return nil
    #endif
  }

  static var lastAppLaunchState: AppLaunchState? {
    get {
      return defaults.codable(forKey: Keys.lastAppLaunchState.rawValue, as: AppLaunchState.self)
    }
    set {
      defaults.set(codable: newValue, forKey: Keys.lastAppLaunchState.rawValue)
    }
  }

  /// Last-applied network traces policy, or `nil` when JS never configured one. Persisted so
  /// early-startup requests follow the last-known setting.
  static var networkTracesConfiguration: NetworkTracesConfiguration? {
    get {
      return defaults.codable(forKey: Keys.networkTracesConfiguration.rawValue, as: NetworkTracesConfiguration.self)
    }
    set {
      defaults.set(codable: newValue, forKey: Keys.networkTracesConfiguration.rawValue)
    }
  }

  /// Whether the app reached TTI in this or an earlier launch. TTI is not marked automatically,
  /// so this tells whether the app calls `markInteractive` at all.
  static var hasMarkedInteractive: Bool {
    get {
      return defaults.bool(forKey: Keys.hasMarkedInteractive.rawValue)
    }
    set {
      defaults.set(newValue, forKey: Keys.hasMarkedInteractive.rawValue)
    }
  }
}
