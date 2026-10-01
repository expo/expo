// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoAppMetrics
import Foundation

/// Stores every record in the SQLite metrics database.
internal final class DatabaseMetricsSink: MetricsSink {
  static let shared = DatabaseMetricsSink()

  /// The shared metrics database, or `nil` in release builds if the database could not be opened even
  /// after a wipe-and-retry. In DEBUG we trap with `assertionFailure` so developers see the failure
  /// immediately; in release we keep the host app running because telemetry should never be
  /// load-bearing for the user's primary work — callers degrade naturally via `?.`.
  @AppMetricsActor
  static let database: MetricsDatabase? = {
    do {
      return try MetricsDatabase.openWipingOnFailure()
    } catch {
      observeLogger.error(
        "[AppMetrics] Failed to open the metrics database after a wipe-and-retry: \(error.localizedDescription). Continuing without persistence — metrics and logs from this launch will be dropped."
      )
      assertionFailure("MetricsDatabase failed to open: \(error)")
      return nil
    }
  }()

  /// A closure, so `shared` can be created on any thread and the database opens later, on the actor.
  private let openDatabase: @AppMetricsActor @Sendable () -> MetricsDatabase?

  /// Tests pass a temporary database.
  init(database: @escaping @AppMetricsActor @Sendable () -> MetricsDatabase? = { DatabaseMetricsSink.database }) {
    self.openDatabase = database
  }

  @AppMetricsActor
  func sessionStarted(_ session: SessionInfo) throws {
    let environment = ObserveUserDefaults.environment ?? ObserveUserDefaults.defaultEnvironment
    try openDatabase()?.insert(session: SessionRow.from(session, environment: environment))
  }

  @AppMetricsActor
  func sessionEnded(id: String, endDate: Date) throws {
    try openDatabase()?.updateSessionActiveStatus(id: id, isActive: false, endTimestamp: endDate.ISO8601Format())
  }

  @AppMetricsActor
  func activeSessionsUpdatesInfoChanged(_ updatesInfo: AppInfo.UpdatesInfo) throws {
    try openDatabase()?.updateAppUpdatesInfoForActiveSessions(
      updateId: updatesInfo.updateId,
      runtimeVersion: updatesInfo.runtimeVersion,
      requestHeadersJSON: encodeAsJSONString(updatesInfo.requestHeaders)
    )
  }

  @AppMetricsActor
  func record(metrics: [Metric], sessionId: String) throws {
    for metric in metrics {
      try openDatabase()?.insert(metric: MetricRow.from(metric: metric, sessionId: sessionId))
    }
  }

  @AppMetricsActor
  func record(logs: [LogRecord], sessionId: String) throws {
    for log in logs {
      try openDatabase()?.insert(log: LogRow.from(log: log, sessionId: sessionId))
    }
  }

  @AppMetricsActor
  func record(spans: [NetworkSpan], sessionId: String) throws {
    for span in spans {
      try openDatabase()?.insert(
        span: SpanRow(
          sessionId: sessionId,
          name: span.name,
          kind: span.kind,
          startTimestampMs: span.startTimestampMs,
          endTimestampMs: span.endTimestampMs,
          statusCode: span.statusCode,
          statusMessage: span.statusMessage,
          attributes: span.attributes,
          events: span.events
        )
      )
    }
  }

  /// Attributes the crash to a stored main session and stores it once per session. Logs a warning
  /// instead of throwing, because only this sink knows the session that a failure belongs to.
  @AppMetricsActor
  func record(crash: CrashReport, log: LogRecord) {
    let mainSessions: [SessionRow]
    do {
      mainSessions = try openDatabase()?.getMainSessions() ?? []
    } catch {
      observeLogger.warn(
        "[AppMetrics] Failed to load main sessions for crash attribution: \(error.localizedDescription)"
      )
      return
    }
    guard let session = crash.findMatchingSession(in: mainSessions) else {
      observeLogger.warn("[AppMetrics] Received crash report with no matching session:\n\(crash)")
      return
    }
    guard let payload = encodeAsJSONString(crash) else {
      return
    }
    do {
      try openDatabase()?.storeCrashReportIfNew(
        sessionId: session.id,
        payload: payload,
        log: LogRow.from(log: log, sessionId: session.id)
      )
    } catch {
      observeLogger.warn(
        "[AppMetrics] Failed to persist crash report for session \(session.id): \(error.localizedDescription)"
      )
    }
  }

  /// Not part of `MetricsSink`: the environment is set by expo-observe, not collected.
  @AppMetricsActor
  func updateEnvironmentForActiveSessions(_ environment: String) throws {
    try openDatabase()?.updateEnvironmentForActiveSessions(environment: environment)
  }
}
