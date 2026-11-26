/// Class that manages a custom `UserDefaults` database with `"dev.expo.app-metrics"` suite name.
public final class AppMetricsUserDefaults: UserDefaults {
  private static let suiteName = "dev.expo.app-metrics"

  /// Singleton instance of the user defaults for AppMetrics.
  private static let defaults = ConsentGatedDefaults(AppMetricsUserDefaults())

  /// Enum with keys used within this user defaults database.
  private enum Keys: String {
    case lastAppLaunchState
    case environment
    case networkTracesConfiguration
  }

  private init() {
    // It's safe to force-unwrap as `init?(suiteName:)` fails only if `suiteName`
    // is the same as the app's main bundle identifier or the global domain.
    super.init(suiteName: Self.suiteName)!
  }

  public static var environment: String? {
    get {
      return defaults.object(forKey: Keys.environment.rawValue) as? String
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

  /// Deletes every saved value. Runs at a launch without consent and at a revoke.
  static func deleteStoredSettings() {
    UserDefaults.standard.removePersistentDomain(forName: suiteName)
  }
}
