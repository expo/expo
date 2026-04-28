// Copyright 2025-present 650 Industries. All rights reserved.
import ExpoModulesCore

#if !os(tvOS)
import MetricKit
#endif

public struct AppMetrics {
  #if !os(tvOS)
  static let metricKitSubscriber = MetricKitSubscriber()

  /**
   Registers the MetricKit subscriber to receive diagnostic and performance payloads.
   Even though MetricKit doesn't work on the simulator, it prints some logs (probably once a day)
   that are piped to the terminal when using the `expo run:ios` command.
   To avoid them, we explicitly don't register the subscriber on the simulator.
   */
  static func registerMetricKitSubscriber() {
    #if !targetEnvironment(simulator)
    MXMetricManager.shared.add(metricKitSubscriber)
    #endif
  }
  #endif

  public static let storage = MetricsStorage()

  // Make the initializer private to prevent non-singleton usage.
  private init() {}

  // MARK: - Environment

  @AppMetricsActor
  public static func setEnvironment(_ environment: String) {
    storage.currentEntry.environment = environment
    guard AppMetricsUserDefaults.environment != environment else { return }
    AppMetricsUserDefaults.environment = environment
    try? storage.commit()
  }

  // MARK: - Main session

  /**
   The main session that tracks metrics for the entire lifecycle of the app process.

   This session starts when the app launches and continues until the app terminates.
   Unlike foreground sessions, there is only one main session per app process.
   */
  static let mainSession = MainSession()

  // MARK: - Foreground session

  /**
   The currently active foreground session, or `nil` if the app is not in the foreground.

   This session tracks metrics while the app is actively visible to the user. It is created
   when the app enters the foreground and cleared when the app enters the background.
   */
  @AppMetricsActor
  static internal private(set) var foregroundSession: Session?

  /**
   Starts a new foreground session, stopping any existing session if one is active.

   This should be called when the app becomes active (enters the foreground). If a previous
   foreground session is still running, it will be stopped and finalized before creating the new session.
   */
  internal static func startNewForegroundSession() {
    AppMetricsActor.isolated {
      if let foregroundSession = Self.foregroundSession {
        log.warn("[AppMetrics] New foreground session started while one was already active. Stopping the old session.")
        foregroundSession.stop()
      }
      foregroundSession = ForegroundSession()
    }
  }

  /**
   Stops and finalizes the current foreground session if one is active.

   This should be called when the app enters the background. The session will be stopped,
   its metrics finalized, and the session reference cleared.
   */
  internal static func stopForegroundSession() {
    AppMetricsActor.isolated {
      foregroundSession?.stop()
      foregroundSession = nil
    }
  }
}
