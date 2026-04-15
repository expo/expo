// Copyright 2025-present 650 Industries. All rights reserved.

public protocol MetricsReceiver {
  /**
   Receives a group of metrics.
   */
  @AppMetricsActor
  func receiveMetrics<MetricsType: Metrics>(_ metrics: MetricsType)

  /**
   Receives a single metric.
   */
  @AppMetricsActor
  func receiveMetric(_ metric: Metric)
}

extension MetricsReceiver {
  @AppMetricsActor
  public func receiveMetrics<MetricsType: Metrics>(_ metrics: MetricsType) {}

  @AppMetricsActor
  public func receiveMetric(_ metric: Metric) {}
}
