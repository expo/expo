// Copyright 2025-present 650 Industries. All rights reserved.
import ExpoModulesCore

#if !os(tvOS)
import MetricKit
#endif

public struct AppMetrics {
  #if !os(tvOS)
  static let metricKitSubscriber = MetricKitSubscriber()

  /// Registers the MetricKit subscriber to receive diagnostic and performance payloads.
  /// Even though MetricKit doesn't work on the simulator, it prints some logs (probably once a day)
  /// that are piped to the terminal when using the `expo run:ios` command.
  /// To avoid them, we explicitly don't register the subscriber on the simulator.
  static func registerMetricKitSubscriber() {
    #if !targetEnvironment(simulator)
    MXMetricManager.shared.add(metricKitSubscriber)
    metricKitSubscriber.processPastPayloads()
    #endif
  }
  #endif

  /// Ingests fatal JavaScript errors that were written to disk before the process was terminated on a
  /// previous launch (see `PendingErrorStore`). Reads the files synchronously, then records each as an
  /// `js.exception` log attributed to the session it was captured in. Called once at launch.
  static func ingestPendingErrors() {
    let pendingErrors = PendingErrorStore.drain()
    guard !pendingErrors.isEmpty else {
      return
    }
    AppMetricsActor.isolated {
      for pendingError in pendingErrors {
        // Each error attaches to the prior-launch session it was captured in (`pendingError.sessionId`),
        // not the just-started `mainSession`, so this doesn't depend on the current session's row INSERT.
        do {
          try MetricsSinkRegistry.shared.record(logs: [pendingError.toLogRecord()], sessionId: pendingError.sessionId)
        } catch {
          logger.warn("[AppMetrics] Failed to ingest pending error: \(error.localizedDescription)")
        }
      }
    }
  }

  // Make the initializer private to prevent non-singleton usage.
  private init() {}

  // MARK: - Read API for downstream consumers (e.g. expo-observe)

  /// Returns metric rows whose `id` is greater than `cursor`, in ascending id order. Consumers persist
  /// the largest seen id and pass it back on subsequent calls to fetch only newer rows. Empty when the
  /// database failed to open. Pass `limit` to return at most that many of the oldest rows.
  @AppMetricsActor
  public static func getMetrics(afterId cursor: Int64, limit: Int? = nil) throws -> [MetricRow] {
    return try DatabaseMetricsSink.database?.getMetrics(afterId: cursor, limit: limit) ?? []
  }

  /// Returns log rows whose `id` is greater than `cursor`, in ascending id order. Empty when the
  /// database failed to open. Pass `limit` to return at most that many of the oldest rows.
  @AppMetricsActor
  public static func getLogs(afterId cursor: Int64, limit: Int? = nil) throws -> [LogRow] {
    return try DatabaseMetricsSink.database?.getLogs(afterId: cursor, limit: limit) ?? []
  }

  /// Hydrates session rows for the given ids. Used to attach session metadata to a batch of metrics
  /// or logs that have already been read past a cursor.
  @AppMetricsActor
  public static func getSessions(ids: [String]) throws -> [SessionRow] {
    return try DatabaseMetricsSink.database?.getSessions(ids: ids) ?? []
  }

  /// The largest metric id currently in the database, or `nil` if the metrics table is empty.
  /// Consumers can compare a persisted dispatch cursor against this to detect that the database was
  /// wiped (or never reached the cursor's value) and reset their cursor accordingly.
  @AppMetricsActor
  public static func getMaxMetricId() throws -> Int64? {
    return try DatabaseMetricsSink.database?.getMaxMetricId() ?? nil
  }

  /// The largest log id currently in the database, or `nil` if the logs table is empty.
  @AppMetricsActor
  public static func getMaxLogId() throws -> Int64? {
    return try DatabaseMetricsSink.database?.getMaxLogId() ?? nil
  }

  /// Returns span rows whose `id` is greater than `cursor`, in ascending id order, at most
  /// `limit` of them (all when `nil`). Empty when the database failed to open.
  @AppMetricsActor
  public static func getSpans(afterId cursor: Int64, limit: Int? = nil) throws -> [SpanRow] {
    return try DatabaseMetricsSink.database?.getSpans(afterId: cursor, limit: limit) ?? []
  }

  /// The largest span id currently in the database, or `nil` if the table is empty.
  @AppMetricsActor
  public static func getMaxSpanId() throws -> Int64? {
    return try DatabaseMetricsSink.database?.getMaxSpanId() ?? nil
  }

  /// Returns the spans attributed to `sessionId`, in ascending id order. Empty when the
  /// database failed to open.
  @AppMetricsActor
  public static func getSpans(forSessionId sessionId: String) throws -> [SpanRow] {
    return try DatabaseMetricsSink.database?.getSpans(forSessionId: sessionId) ?? []
  }

  /// Deletes span rows with `id <= upToId`. The exporter owns deletion; the per-session read
  /// (`getSpans(forSessionId:)`) sees only rows not yet dispatched.
  @AppMetricsActor
  public static func deleteSpans(upToId: Int64) throws {
    try DatabaseMetricsSink.database?.deleteSpans(upToId: upToId)
  }

  /// The inactive (ended) sessions with their children. For expo-observe debug APIs. Removed when
  /// storage moves to expo-observe.
  @AppMetricsActor
  public static func getInactiveStoredSessions() throws -> [StoredSession] {
    return try DatabaseMetricsSink.database?.getInactiveSessionsWithChildren().map { StoredSession(from: $0) } ?? []
  }

  /// The metrics stored for `sessionId`. For expo-observe debug APIs. Removed when storage moves to
  /// expo-observe.
  @AppMetricsActor
  public static func getStoredMetrics(sessionId: String) throws -> [Metric] {
    return decodeMetrics(from: try DatabaseMetricsSink.database?.getMetrics(sessionId: sessionId) ?? [])
  }

  /// The log records stored for `sessionId`. For expo-observe debug APIs. Removed when storage moves
  /// to expo-observe.
  @AppMetricsActor
  public static func getStoredLogs(sessionId: String) throws -> [LogRecord] {
    return decodeLogs(from: try DatabaseMetricsSink.database?.getLogs(sessionId: sessionId) ?? [])
  }

  // MARK: - Environment

  @AppMetricsActor
  public static func setEnvironment(_ environment: String) {
    guard AppMetricsUserDefaults.environment != environment else { return }
    AppMetricsUserDefaults.environment = environment
    do {
      try DatabaseMetricsSink.shared.updateEnvironmentForActiveSessions(environment)
    } catch {
      logger.warn("[AppMetrics] Failed to propagate environment to active sessions: \(error.localizedDescription)")
    }
  }

  // MARK: - Main session

  /// The main session that tracks metrics for the entire lifecycle of the app process.
  ///
  /// This session starts when the app launches and continues until the app terminates.
  /// Unlike foreground sessions, there is only one main session per app process.
  static let mainSession = MainSession()

  // MARK: - Foreground session

  /// The currently active foreground session, or `nil` if the app is not in the foreground.
  ///
  /// This session tracks metrics while the app is actively visible to the user. It is created
  /// when the app enters the foreground and cleared when the app enters the background.
  @AppMetricsActor
  static internal private(set) var foregroundSession: Session?

  /// Starts a new foreground session, stopping any existing session if one is active.
  ///
  /// This should be called when the app becomes active (enters the foreground). If a previous
  /// foreground session is still running, it will be stopped and finalized before creating the new session.
  internal static func startNewForegroundSession() {
    AppMetricsActor.isolated {
      if let foregroundSession = Self.foregroundSession {
        logger.warn(
          "[AppMetrics] New foreground session started while one was already active. Stopping the old session."
        )
        foregroundSession.stop()
      }
      foregroundSession = ForegroundSession()
    }
  }

  /// Stops and finalizes the current foreground session if one is active.
  ///
  /// This should be called when the app enters the background. The session will be stopped,
  /// its metrics finalized, and the session reference cleared.
  internal static func stopForegroundSession() {
    AppMetricsActor.isolated {
      foregroundSession?.stop()
      foregroundSession = nil
    }
  }
}
