// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

/// Hands every collected record to the registered `MetricsSink`, with the global attributes merged
/// into metrics and logs. Records emitted before the first registration wait in a bounded buffer
/// and are replayed, in order, to the first registered sink.
///
/// For expo-observe. Not a stable API.
public final class MetricsSinkRegistry: Sendable {
  static let shared = MetricsSinkRegistry()

  private static let bufferCapacity = 500

  private struct State {
    var sink: (any MetricsSink)?
    /// Records that wait for the first sink, and then for the replay to it.
    var buffer: [SinkEvent] = []
    /// The first sink, while the buffer replays to it.
    var replaySink: (any MetricsSink)?
    var hasWarnedFullBuffer = false
  }

  /// A lock, not the actor, so registration is synchronous on any thread and lands before the
  /// first record that the caller emits after it.
  private let state = Mutex(State())

  /// Registers `sink` as the receiver of all records. Registering the same instance again does
  /// nothing. A different instance replaces the current one.
  public static func register(_ sink: any MetricsSink) {
    shared.register(sink)
  }

  func register(_ newSink: any MetricsSink) {
    let replays = state.withLock { state -> Bool in
      guard state.sink !== newSink else {
        return false
      }
      #if DEBUG
      if state.sink != nil {
        logger.warn("[AppMetrics] Replacing the registered metrics sink")
      }
      #endif
      let isFirst = state.sink == nil
      state.sink = newSink
      guard isFirst, !state.buffer.isEmpty else {
        return false
      }
      state.replaySink = newSink
      return true
    }
    if replays {
      AppMetricsActor.isolated { self.replayBuffer() }
    }
  }

  @AppMetricsActor
  func sessionStarted(_ session: SessionInfo) throws {
    try emit(.sessionStarted(session))
  }

  @AppMetricsActor
  func sessionEnded(id: String, endDate: Date) throws {
    try emit(.sessionEnded(id: id, endDate: endDate))
  }

  @AppMetricsActor
  func activeSessionsUpdatesInfoChanged(_ updatesInfo: AppInfo.UpdatesInfo) throws {
    try emit(.updatesInfoChanged(updatesInfo))
  }

  @AppMetricsActor
  func record(metrics: [Metric], sessionId: String) throws {
    try emit(.metrics(metrics.map { $0.withGlobalAttributes() }, sessionId: sessionId))
  }

  @AppMetricsActor
  func record(logs: [LogRecord], sessionId: String) throws {
    try emit(.logs(logs.map { $0.withGlobalAttributes() }, sessionId: sessionId))
  }

  @AppMetricsActor
  func record(spans: [NetworkSpan], sessionId: String) throws {
    try emit(.spans(spans, sessionId: sessionId))
  }

  @AppMetricsActor
  func record(crash: CrashReport, log: LogRecord) throws {
    try emit(.crash(crash, log: log.withGlobalAttributes()))
  }

  /// Sends `event` to the sink, or appends it to the buffer while no sink is registered or the
  /// replay is pending, so it cannot pass a buffered record.
  @AppMetricsActor
  private func emit(_ event: SinkEvent) throws {
    let sink: (any MetricsSink)? = state.withLock { state in
      if state.sink == nil {
        guard state.buffer.count < Self.bufferCapacity else {
          #if DEBUG
          if !state.hasWarnedFullBuffer {
            state.hasWarnedFullBuffer = true
            logger.warn("[AppMetrics] The metrics sink buffer is full. Dropping new records until a sink registers")
          }
          #endif
          return nil
        }
        state.buffer.append(event)
        return nil
      }
      if state.replaySink != nil {
        state.buffer.append(event)
        return nil
      }
      return state.sink
    }
    try sink.map { try event.send(to: $0) }
  }

  /// Sends the buffered records to the first sink in order. The loop does not suspend, so records
  /// that other actor jobs emit wait until it ends. The buffer stays open for records that the sink
  /// itself emits during the replay, and it closes once it is empty.
  @AppMetricsActor
  private func replayBuffer() {
    while case (let event, let sink)? = nextBufferedEvent() {
      do {
        try event.send(to: sink)
      } catch {
        logger.warn("[AppMetrics] Failed to replay a buffered record: \(error.localizedDescription)")
      }
    }
  }

  private func nextBufferedEvent() -> (SinkEvent, any MetricsSink)? {
    return state.withLock { state in
      guard let sink = state.replaySink else {
        return nil
      }
      guard !state.buffer.isEmpty else {
        state.replaySink = nil
        return nil
      }
      return (state.buffer.removeFirst(), sink)
    }
  }
}

/// One sink operation, kept until a sink can receive it.
private enum SinkEvent {
  case sessionStarted(SessionInfo)
  case sessionEnded(id: String, endDate: Date)
  case updatesInfoChanged(AppInfo.UpdatesInfo)
  case metrics([Metric], sessionId: String)
  case logs([LogRecord], sessionId: String)
  case spans([NetworkSpan], sessionId: String)
  case crash(CrashReport, log: LogRecord)

  @AppMetricsActor
  func send(to sink: any MetricsSink) throws {
    switch self {
    case .sessionStarted(let session):
      try sink.sessionStarted(session)
    case .sessionEnded(let id, let endDate):
      try sink.sessionEnded(id: id, endDate: endDate)
    case .updatesInfoChanged(let updatesInfo):
      try sink.activeSessionsUpdatesInfoChanged(updatesInfo)
    case .metrics(let metrics, let sessionId):
      try sink.record(metrics: metrics, sessionId: sessionId)
    case .logs(let logs, let sessionId):
      try sink.record(logs: logs, sessionId: sessionId)
    case .spans(let spans, let sessionId):
      try sink.record(spans: spans, sessionId: sessionId)
    case .crash(let report, let log):
      try sink.record(crash: report, log: log)
    }
  }
}

extension Metric {
  /// The metric with the global attributes merged into its params. Per-metric keys win.
  fileprivate func withGlobalAttributes() -> Metric {
    var metric = self
    metric.params = GlobalAttributes.merged(with: params?.value as? [String: Any]).map { AnyCodable($0) }
    return metric
  }
}

extension LogRecord {
  /// The log with the global attributes merged into its attributes. Per-event keys win.
  fileprivate func withGlobalAttributes() -> LogRecord {
    return LogRecord(
      name: name,
      body: body,
      attributes: GlobalAttributes.merged(with: attributes?.value as? [String: Any]),
      droppedAttributesCount: droppedAttributesCount,
      severity: severity,
      timestamp: timestamp
    )
  }
}
