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
    metricKitSubscriber.processPastPayloads()
    #endif
  }
  #endif

  /**
   The shared metrics database, or `nil` in release builds if the database could not be opened even
   after a wipe-and-retry. In DEBUG we trap with `assertionFailure` so developers see the failure
   immediately; in release we keep the host app running because telemetry should never be
   load-bearing for the user's primary work — callers degrade naturally via `?.`.
   */
  @AppMetricsActor
  static let database: MetricsDatabase? = {
    do {
      return try MetricsDatabase.openWipingOnFailure()
    } catch {
      logger.error("[AppMetrics] Failed to open the metrics database after a wipe-and-retry: \(error.localizedDescription). Continuing without persistence — metrics and logs from this launch will be dropped.")
      assertionFailure("MetricsDatabase failed to open: \(error)")
      return nil
    }
  }()

  // Make the initializer private to prevent non-singleton usage.
  private init() {}

  // MARK: - Read API for downstream consumers (e.g. expo-observe)

  /**
   Returns metric rows whose `id` is greater than `cursor`, in ascending id order. Consumers persist
   the largest seen id and pass it back on subsequent calls to fetch only newer rows. Empty when the
   database failed to open.
   */
  @AppMetricsActor
  public static func getMetrics(afterId cursor: Int64) throws -> [MetricRow] {
    return try database?.getMetrics(afterId: cursor) ?? []
  }

  /**
   Returns log rows whose `id` is greater than `cursor`, in ascending id order. Empty when the
   database failed to open.
   */
  @AppMetricsActor
  public static func getLogs(afterId cursor: Int64) throws -> [LogRow] {
    return try database?.getLogs(afterId: cursor) ?? []
  }

  /**
   Hydrates session rows for the given ids. Used to attach session metadata to a batch of metrics
   or logs that have already been read past a cursor.
   */
  @AppMetricsActor
  public static func getSessions(ids: [String]) throws -> [SessionRow] {
    return try database?.getSessions(ids: ids) ?? []
  }

  /**
   The largest metric id currently in the database, or `nil` if the metrics table is empty.
   Consumers can compare a persisted dispatch cursor against this to detect that the database was
   wiped (or never reached the cursor's value) and reset their cursor accordingly.
   */
  @AppMetricsActor
  public static func getMaxMetricId() throws -> Int64? {
    return try database?.getMaxMetricId() ?? nil
  }

  /**
   The largest log id currently in the database, or `nil` if the logs table is empty.
   */
  @AppMetricsActor
  public static func getMaxLogId() throws -> Int64? {
    return try database?.getMaxLogId() ?? nil
  }

  // MARK: - Environment

  @AppMetricsActor
  public static func setEnvironment(_ environment: String) {
    guard AppMetricsUserDefaults.environment != environment else { return }
    AppMetricsUserDefaults.environment = environment
    do {
      try database?.updateEnvironmentForActiveSessions(environment: environment)
    } catch {
      logger.warn("[AppMetrics] Failed to propagate environment to active sessions: \(error.localizedDescription)")
    }
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
