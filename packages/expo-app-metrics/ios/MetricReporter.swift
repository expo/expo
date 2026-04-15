// Copyright 2025-present 650 Industries. All rights reserved.

open class MetricReporter {
  var receivers: [any MetricsReceiver] = []

  func addReceiver(_ receiver: MetricsReceiver) {
    self.receivers.append(receiver)
  }

  @AppMetricsActor
  func reportMetrics(_ metrics: any Metrics) {
    Task {
      for receiver in self.receivers {
        receiver.receiveMetrics(metrics)
      }
    }
  }

  @AppMetricsActor
  func reportMetric(_ metric: Metric) {
    Task {
      for receiver in receivers {
        logger.info("[AppMetrics] Reporting metric \"\(metric.getMetricKey())\" with value: \(metric.value)")
        receiver.receiveMetric(metric)
      }
    }
  }

  @AppMetricsActor
  func reportMetric(category: Metric.Category?, name: String, value: Double) {
    reportMetric(Metric(category: category, name: name, value: value))
  }
}
