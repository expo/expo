/**
 Session is a time frame during the app's lifetime that tracks various metrics from its start till its end.
 */
public class Session: Codable, MetricsReceiver, @unchecked Sendable {
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

  /**
   An array of metrics collected during the session.
   */
  public private(set) var metrics: [Metric] = []

  /**
   An array of log records collected during the session.
   */
  public private(set) var logs: [LogRecord] = []

  init(type: SessionType = .custom) {
    self.id = UUID().uuidString
    self.startDate = Date.now
    self.type = type

    AppMetrics.storage.currentEntry.add(session: self)
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
   Stops the session and commits the contents of the storage.
   */
  func stop() {
    if endDate != nil {
      // Can't stop session more than once
      return
    }
    endDate = Date.now
    metrics.append(Metric(category: .session, name: "duration", value: duration))

    AppMetricsActor.isolated {
      try? AppMetrics.storage.commit()
    }
  }

  // MARK: - Session type

  public enum SessionType: String, Codable {
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
    self.metrics.append(metric)

    // It's probably not the best approach to commit the storage on every received metric,
    // but it seems fine for the proof of concept.
    try? AppMetrics.storage.commit()
  }

  @AppMetricsActor
  public func receiveLog(_ log: LogRecord) {
    self.logs.append(log)
    try? AppMetrics.storage.commit()
  }

  // MARK: - Codable

  private enum CodingKeys: String, CodingKey {
    case id, type, startDate, endDate, metrics, logs
  }

  public required init(from decoder: any Decoder) throws {
    let values = try decoder.container(keyedBy: CodingKeys.self)
    id = try values.decode(String.self, forKey: .id)
    type = try values.decodeIfPresent(SessionType.self, forKey: .type) ?? .unknown
    startDate = try values.decode(Date.self, forKey: .startDate)
    endDate = try values.decodeIfPresent(Date.self, forKey: .endDate)
    metrics = try values.decodeIfPresent([Metric].self, forKey: .metrics) ?? []
    logs = try values.decodeIfPresent([LogRecord].self, forKey: .logs) ?? []
  }
}
