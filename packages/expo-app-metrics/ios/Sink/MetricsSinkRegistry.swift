// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

/// Hands every collected record to the registered `MetricsSink`, with the global attributes merged
/// into metrics and logs. Records emitted while no sink is registered are dropped.
///
/// For expo-observe. Not a stable API.
public final class MetricsSinkRegistry: Sendable {
  static let shared = MetricsSinkRegistry()

  /// A lock, not the actor, so registration is synchronous on any thread and lands before the
  /// first record that the caller emits after it.
  private let sink = Mutex<(any MetricsSink)?>(nil)

  /// Registers `sink` as the receiver of all records. Registering the same instance again does
  /// nothing. A different instance replaces the current one.
  public static func register(_ sink: any MetricsSink) {
    shared.register(sink)
  }

  func register(_ newSink: any MetricsSink) {
    sink.withLock { current in
      guard current !== newSink else {
        return
      }
      #if DEBUG
      if current != nil {
        logger.warn("[AppMetrics] Replacing the registered metrics sink")
      }
      #endif
      current = newSink
    }
  }

  @AppMetricsActor
  func sessionStarted(_ session: SessionInfo) throws {
    try currentSink()?.sessionStarted(session)
  }

  @AppMetricsActor
  func sessionEnded(id: String, endDate: Date) throws {
    try currentSink()?.sessionEnded(id: id, endDate: endDate)
  }

  @AppMetricsActor
  func activeSessionsUpdatesInfoChanged(_ updatesInfo: AppInfo.UpdatesInfo) throws {
    try currentSink()?.activeSessionsUpdatesInfoChanged(updatesInfo)
  }

  @AppMetricsActor
  func record(metrics: [Metric], sessionId: String) throws {
    try currentSink()?.record(metrics: metrics.map { $0.withGlobalAttributes() }, sessionId: sessionId)
  }

  @AppMetricsActor
  func record(logs: [LogRecord], sessionId: String) throws {
    try currentSink()?.record(logs: logs.map { $0.withGlobalAttributes() }, sessionId: sessionId)
  }

  @AppMetricsActor
  func record(spans: [NetworkSpan], sessionId: String) throws {
    try currentSink()?.record(spans: spans, sessionId: sessionId)
  }

  @AppMetricsActor
  func record(crash: CrashReport, log: LogRecord) throws {
    try currentSink()?.record(crash: crash, log: log.withGlobalAttributes())
  }

  private func currentSink() -> (any MetricsSink)? {
    return sink.withLock { $0 }
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
