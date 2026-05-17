import Foundation

/**
 Session is a time frame during the app's lifetime that tracks various metrics from its start till its end.
 */
public class Session: MetricsReceiver, @unchecked Sendable {
  /**
   Unique ID of the session in UUID v4 format.
   */
  public let id: String

  /**
   Type of the session. It is one of: `main`, `foreground`, `screen`, `custom` or `unknown`.
   */
  public let type: SessionType

  /**
   Date on which the session was created and started.
   */
  public let startDate: Date

  /**
   Date on which the `stop()` function was called to end the session, or `nil` if the session is still active.
   */
  private(set) var endDate: Date?

  init(type: SessionType = .custom) {
    self.id = UUID().uuidString
    self.startDate = Date.now
    self.type = type

    // The session-row INSERT is fire-and-forget on `AppMetricsActor`. Subsequent writes for this
    // session (metrics, logs, `stop()`, crash reports) all go through the same actor, and tasks on
    // an actor run in submission order — so they always observe the INSERT before their own SQL
    // runs, even though no caller `await`s the task returned here. The invariant only holds because
    // every metric-producing path enqueues *after* `Session.init` returns; if a future caller
    // submits to `AppMetricsActor` from a parallel task that could race `init`, this should be
    // converted to a stored `sessionStartTask` that downstream writes `await` before proceeding.
    AppMetricsActor.isolated { [self] in
      let environment = AppMetricsUserDefaults.environment ?? AppMetricsUserDefaults.getDefaultEnvironment()
      do {
        try AppMetrics.database?.insert(session: SessionRow.snapshot(of: self, environment: environment))
      } catch {
        logger.warn("[AppMetrics] Failed to insert session row: \(error.localizedDescription)")
      }
    }
  }

  /**
   Non-registering initializer that builds a session with explicit values.
   The caller is responsible for adding it to storage (or skipping that step,
   e.g. in tests).
   */
  init(id: String, type: SessionType, startDate: Date, endDate: Date?) {
    self.id = id
    self.type = type
    self.startDate = startDate
    self.endDate = endDate
  }

  /**
   Whether the session is still running, i.e. did not end yet.
   */
  var isActive: Bool {
    return endDate == nil
  }

  /**
   Session's duration in seconds since its start to an end, or until now if the session is still active.
   */
  var duration: TimeInterval {
    let endDate = self.endDate ?? Date.now
    return endDate.timeIntervalSince(startDate)
  }

  /**
   Stops the session, persists its end timestamp, and writes a final duration metric.
   */
  func stop() {
    if endDate != nil {
      // Can't stop session more than once
      return
    }
    let endDate = Date.now
    self.endDate = endDate
    let durationMetric = Metric(category: .session, name: "duration", value: duration)

    AppMetricsActor.isolated { [self] in
      do {
        try AppMetrics.database?.updateSessionActiveStatus(
          id: self.id,
          isActive: false,
          endTimestamp: endDate.ISO8601Format()
        )
        try AppMetrics.database?.insert(metric: MetricRow.from(metric: durationMetric, sessionId: self.id))
      } catch {
        logger.warn("[AppMetrics] Failed to finalize session \(self.id): \(error.localizedDescription)")
      }
    }
  }

  // MARK: - Session type

  public enum SessionType: String, Codable, Sendable {
    /// The main session that tracks metrics for the entire app process lifecycle.
    case main

    /// A session that tracks metrics while the app is actively visible to the user in the foreground.
    case foreground

    /// A session that tracks metrics for a single screen that was visible to the user.
    case screen

    /// A custom session defined by the app developer for tracking specific user flows or features.
    case custom

    /// Unknown session type, typically used as a fallback when decoding fails.
    case unknown
  }

  // MARK: - Monitoring memory usage

  let memoryMeter = MemoryMonitoring()

  // MARK: - MetricsReceiver

  @AppMetricsActor
  public func receiveMetric(_ metric: Metric) {
    do {
      try AppMetrics.database?.insert(metric: MetricRow.from(metric: metric, sessionId: self.id))
    } catch {
      logger.warn("[AppMetrics] Failed to insert metric \"\(metric.getMetricKey())\" for session \(self.id): \(error.localizedDescription)")
    }
  }

  @AppMetricsActor
  public func receiveLog(_ log: LogRecord) {
    do {
      try AppMetrics.database?.insert(log: LogRow.from(log: log, sessionId: self.id))
    } catch {
      logger.warn("[AppMetrics] Failed to insert log \"\(log.name)\" for session \(self.id): \(error.localizedDescription)")
    }
  }
}
