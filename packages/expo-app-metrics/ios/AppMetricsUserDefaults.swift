/**
 Class that manages a custom `UserDefaults` database with `"dev.expo.app-metrics"` suite name.
 */
public final class AppMetricsUserDefaults: UserDefaults {
  /**
   Singleton instance of the user defaults for AppMetrics.
   It is not isolated, but UserDefaults is thread-safe.
   */
  nonisolated(unsafe) private static let defaults = AppMetricsUserDefaults()

  /**
   Enum with keys used within this user defaults database.
   */
  private enum Keys: String {
    case lastAppLaunchState
    case environment
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
}
