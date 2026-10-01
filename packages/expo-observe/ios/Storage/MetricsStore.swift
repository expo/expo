// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoAppMetrics

/// Read API of the metrics database used by the dispatch loops and the debug APIs.
@AppMetricsActor
internal enum MetricsStore {
  /// Returns metric rows whose `id` is greater than `cursor`, in ascending id order. Consumers persist
  /// the largest seen id and pass it back on subsequent calls to fetch only newer rows. Empty when the
  /// database failed to open. Pass `limit` to return at most that many of the oldest rows.
  static func getMetrics(afterId cursor: Int64, limit: Int? = nil) throws -> [MetricRow] {
    return try DatabaseMetricsSink.database?.getMetrics(afterId: cursor, limit: limit) ?? []
  }

  /// Returns log rows whose `id` is greater than `cursor`, in ascending id order. Empty when the
  /// database failed to open. Pass `limit` to return at most that many of the oldest rows.
  static func getLogs(afterId cursor: Int64, limit: Int? = nil) throws -> [LogRow] {
    return try DatabaseMetricsSink.database?.getLogs(afterId: cursor, limit: limit) ?? []
  }

  /// Hydrates session rows for the given ids. Used to attach session metadata to a batch of metrics
  /// or logs that have already been read past a cursor.
  static func getSessions(ids: [String]) throws -> [SessionRow] {
    return try DatabaseMetricsSink.database?.getSessions(ids: ids) ?? []
  }

  /// The largest metric id currently in the database, or `nil` if the metrics table is empty.
  /// Consumers can compare a persisted dispatch cursor against this to detect that the database was
  /// wiped (or never reached the cursor's value) and reset their cursor accordingly.
  static func getMaxMetricId() throws -> Int64? {
    return try DatabaseMetricsSink.database?.getMaxMetricId() ?? nil
  }

  /// The largest log id currently in the database, or `nil` if the logs table is empty.
  static func getMaxLogId() throws -> Int64? {
    return try DatabaseMetricsSink.database?.getMaxLogId() ?? nil
  }

  /// Returns span rows whose `id` is greater than `cursor`, in ascending id order, at most
  /// `limit` of them (all when `nil`). Empty when the database failed to open.
  static func getSpans(afterId cursor: Int64, limit: Int? = nil) throws -> [SpanRow] {
    return try DatabaseMetricsSink.database?.getSpans(afterId: cursor, limit: limit) ?? []
  }

  /// The largest span id currently in the database, or `nil` if the table is empty.
  static func getMaxSpanId() throws -> Int64? {
    return try DatabaseMetricsSink.database?.getMaxSpanId() ?? nil
  }

  /// Returns the spans attributed to `sessionId`, in ascending id order. Empty when the
  /// database failed to open.
  static func getSpans(forSessionId sessionId: String) throws -> [SpanRow] {
    return try DatabaseMetricsSink.database?.getSpans(forSessionId: sessionId) ?? []
  }

  /// Deletes span rows with `id <= upToId`. The exporter owns deletion; the per-session read
  /// (`getSpans(forSessionId:)`) sees only rows not yet dispatched.
  static func deleteSpans(upToId: Int64) throws {
    try DatabaseMetricsSink.database?.deleteSpans(upToId: upToId)
  }

  /// The inactive (ended) sessions with their children.
  static func getInactiveStoredSessions() throws -> [StoredSession] {
    return try DatabaseMetricsSink.database?.getInactiveSessionsWithChildren().map { StoredSession(from: $0) } ?? []
  }

  /// The metrics stored for `sessionId`.
  static func getStoredMetrics(sessionId: String) throws -> [Metric] {
    return decodeMetrics(from: try DatabaseMetricsSink.database?.getMetrics(sessionId: sessionId) ?? [])
  }

  /// The log records stored for `sessionId`.
  static func getStoredLogs(sessionId: String) throws -> [LogRecord] {
    return decodeLogs(from: try DatabaseMetricsSink.database?.getLogs(sessionId: sessionId) ?? [])
  }

  static func setEnvironment(_ environment: String) {
    guard ObserveUserDefaults.environment != environment else { return }
    ObserveUserDefaults.environment = environment
    do {
      try DatabaseMetricsSink.shared.updateEnvironmentForActiveSessions(environment)
    } catch {
      observeLogger.warn(
        "[AppMetrics] Failed to propagate environment to active sessions: \(error.localizedDescription)"
      )
    }
  }
}
