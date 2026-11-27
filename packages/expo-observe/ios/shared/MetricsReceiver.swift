// Copyright 2025-present 650 Industries. All rights reserved.

protocol MetricsReceiver {
  /// Receives a group of metrics.
  @AppMetricsActor
  func receiveMetrics<MetricsType: Metrics>(_ metrics: MetricsType)

  /// Receives a single metric.
  @AppMetricsActor
  func receiveMetric(_ metric: Metric)

  /// Receives a single log record.
  @AppMetricsActor
  func receiveLog(_ log: LogRecord)
}

extension MetricsReceiver {
  @AppMetricsActor
  func receiveMetrics<MetricsType: Metrics>(_ metrics: MetricsType) {}

  @AppMetricsActor
  func receiveMetric(_ metric: Metric) {}

  @AppMetricsActor
  func receiveLog(_ log: LogRecord) {}
}
