// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// Mirrors the TypeScript `MetricInput` type. The owning session is implied by the
/// shared object the metric is added to, so the input carries no session id —
/// `Session.insert` stamps the storage row with the session's own id.
struct SessionMetricInput: Record {
  @Field var category: String = ""
  @Field var name: String = ""
  @Field var value: Double = 0
  @Field var timestamp: String = Date.now.ISO8601Format()
  @Field var routeName: String?
  @Field var params: [String: Any]?

  func toMetric() -> Metric {
    return Metric(
      category: Metric.Category(rawValue: category),
      name: name,
      value: value,
      timestamp: timestamp,
      routeName: routeName,
      updateId: nil,
      params: params
    )
  }
}
