// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// Receives every record that expo-app-metrics collects. Register an implementation with
/// `MetricsSinkRegistry.register(_:)`.
///
/// For expo-observe. Not a stable API.
public protocol MetricsSink: AnyObject, Sendable {
  @AppMetricsActor
  func sessionStarted(_ session: SessionInfo) throws

  @AppMetricsActor
  func sessionEnded(id: String, endDate: Date) throws

  /// The launched update became known after the active sessions started.
  @AppMetricsActor
  func activeSessionsUpdatesInfoChanged(_ updatesInfo: AppInfo.UpdatesInfo) throws

  @AppMetricsActor
  func record(metrics: [Metric], sessionId: String) throws

  @AppMetricsActor
  func record(logs: [LogRecord], sessionId: String) throws

  @AppMetricsActor
  func record(spans: [NetworkSpan], sessionId: String) throws

  /// A native crash from a previous launch. The sink attributes it to a session.
  @AppMetricsActor
  func record(crash: CrashReport, log: LogRecord) throws
}
