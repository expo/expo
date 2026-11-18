// Copyright 2025-present 650 Industries. All rights reserved.

/// Values that only the host app knows. The host passes them to `AppMetrics.configure(_:)` once at
/// launch, before the main session starts. The defaults describe a host without React Native and
/// expo-updates.
struct AppMetricsHost: Sendable {
  /// Reads the running update.
  var updatesInfo: @Sendable () -> AppInfo.UpdatesInfo = { .empty }

  /// Duration of the JS bundle evaluation in seconds, or `nil` while unknown.
  var bundleLoadTime: @Sendable () -> TimeInterval? = { nil }

  /// Identifies the install in dispatched telemetry.
  var clientId = ""

  /// The install's stable value in [0, 1) that the sample rates compare against.
  var clientSampleValue = 0.0

  /// Treats the app as a development build when deciding whether to dispatch.
  var isDebugBuild = false
}

extension AppMetrics {
  private static let hostState = Mutex<(host: AppMetricsHost, isSet: Bool)>((AppMetricsHost(), false))

  /// The host values, or the defaults until `configure(_:)` runs.
  static var host: AppMetricsHost {
    return hostState.withLock { $0.host }
  }

  /// Sets the host values. Call once at launch, before the main session starts. A second call is
  /// ignored with a warning.
  static func configure(_ host: AppMetricsHost) {
    let didSet = hostState.withLock { state in
      guard !state.isSet else {
        return false
      }
      state = (host, true)
      return true
    }
    if !didSet {
      logger.warn(
        "[AppMetrics] Ignoring `configure`: the host values were already set. Call it once at launch, before the main session starts."
      )
    }
  }
}
